import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import { auth } from '../middleware/auth.js';
import evaluationService from '../services/evaluationService.js';
import modelVersioningService from '../services/modelVersioningService.js';

const router = express.Router();

// Configure multer for test data uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// POST /api/evaluation/evaluate
// Evaluate model performance on uploaded test data
router.post('/evaluate', auth, upload.single('testData'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No test data file uploaded' });
    }

    const { workspaceId, modelId, description } = req.body;
    if (!workspaceId || !modelId) {
      return res.status(400).json({ message: 'workspaceId and modelId are required' });
    }

    console.log(`📊 Evaluating model ${modelId} for workspace ${workspaceId}`);

    // Read and parse test data
    const testDataContent = await fs.readFile(req.file.path, 'utf8');
    let testData;
    
    try {
      testData = JSON.parse(testDataContent);
    } catch (parseError) {
      await fs.remove(req.file.path);
      return res.status(400).json({ message: 'Invalid JSON format in test data' });
    }

    // Validate test data
    const validation = evaluationService.validateTestData(testData);
    if (!validation.isValid) {
      await fs.remove(req.file.path);
      return res.status(400).json({ 
        message: 'Invalid test data format',
        errors: validation.errors,
        stats: validation.stats
      });
    }

    // Evaluate model
    const evaluationResult = await evaluationService.evaluateModel(testData, workspaceId, modelId);

    // Create model version with evaluation results
    const versionData = {
      modelId,
      intents: [...new Set(testData.map(item => item.label || item.intent))],
      trainingExamples: testData.length,
      trainingData: testData.slice(0, 5), // Store sample for reference
      description: description || `Model evaluation on ${testData.length} test samples`,
      tags: ['evaluated'],
      createdBy: req.user?.id || 'system'
    };

    const modelVersion = await modelVersioningService.createModelVersion(
      workspaceId, 
      versionData, 
      evaluationResult
    );

    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.status(200).json({
      message: 'Model evaluation completed successfully',
      evaluation: {
        id: evaluationResult.id,
        metrics: evaluationResult.metrics,
        confusionMatrix: evaluationResult.confusionMatrix,
        testDataSize: evaluationResult.testDataSize
      },
      modelVersion: {
        id: modelVersion.id,
        versionNumber: modelVersion.versionNumber,
        createdAt: modelVersion.createdAt
      }
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }

    res.status(500).json({ 
      message: 'Evaluation failed',
      error: error.message 
    });
  }
});

// POST /api/evaluation/evaluate-holdout
// Evaluate model on holdout test set (split from training data)
router.post('/evaluate-holdout', auth, async (req, res) => {
  try {
    const { workspaceId, modelId, holdoutRatio = 0.2 } = req.body;
    
    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // Get the trained model info for this workspace (source of training data)
    const huggingfaceService = (await import('../services/huggingfaceService.js')).default;
    const modelInfo = huggingfaceService.getModelInfo(workspaceId);
    if (!modelInfo) {
      return res.status(404).json({ message: 'No trained model found for this workspace' });
    }

    // Use the model's training data to create a holdout set
    const trainingData = modelInfo.trainingData || [];
    if (!Array.isArray(trainingData) || trainingData.length < 2) {
      return res.status(400).json({ message: 'Insufficient training data for holdout evaluation' });
    }

    const shuffledData = [...trainingData].sort(() => Math.random() - 0.5);
    const holdoutSize = Math.max(1, Math.floor(trainingData.length * Number(holdoutRatio)));
    const holdoutData = shuffledData.slice(0, holdoutSize);

    // Evaluate on holdout data
    const evaluationResult = await evaluationService.evaluateModel(holdoutData, workspaceId, modelInfo.id);

    res.status(200).json({
      message: 'Holdout evaluation completed successfully',
      evaluation: {
        id: evaluationResult.id,
        metrics: evaluationResult.metrics,
        confusionMatrix: evaluationResult.confusionMatrix,
        testDataSize: evaluationResult.testDataSize,
        holdoutRatio
      }
    });

  } catch (error) {
    console.error('Holdout evaluation error:', error);
    res.status(500).json({ 
      message: 'Holdout evaluation failed',
      error: error.message 
    });
  }
});

// GET /api/evaluation/results/:evaluationId
// Get evaluation results by ID
router.get('/results/:evaluationId', auth, async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const evaluation = evaluationService.getEvaluationResult(evaluationId);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.json({
      message: 'Evaluation results retrieved successfully',
      evaluation
    });

  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve evaluation results',
      error: error.message 
    });
  }
});

// GET /api/evaluation/workspace/:workspaceId
// Get all evaluations for a workspace
router.get('/workspace/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const evaluations = evaluationService.getWorkspaceEvaluations(workspaceId);

    res.json({
      message: 'Workspace evaluations retrieved successfully',
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        modelId: evaluation.modelId,
        timestamp: evaluation.timestamp,
        metrics: evaluation.metrics,
        testDataSize: evaluation.testDataSize
      }))
    });

  } catch (error) {
    console.error('Get workspace evaluations error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve workspace evaluations',
      error: error.message 
    });
  }
});

// POST /api/evaluation/compare
// Compare multiple model evaluations
router.post('/compare', auth, async (req, res) => {
  try {
    const { evaluationIds } = req.body;
    
    if (!evaluationIds || !Array.isArray(evaluationIds) || evaluationIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 evaluation IDs are required' });
    }

    const comparison = evaluationService.compareEvaluations(evaluationIds);

    res.json({
      message: 'Evaluation comparison completed successfully',
      comparison
    });

  } catch (error) {
    console.error('Evaluation comparison error:', error);
    res.status(500).json({ 
      message: 'Evaluation comparison failed',
      error: error.message 
    });
  }
});

// GET /api/evaluation/export/:evaluationId
// Export evaluation results
router.get('/export/:evaluationId', auth, async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const exportData = evaluationService.exportEvaluation(evaluationId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="evaluation_${evaluationId}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export evaluation error:', error);
    res.status(500).json({ 
      message: 'Export failed',
      error: error.message 
    });
  }
});

export default router;
