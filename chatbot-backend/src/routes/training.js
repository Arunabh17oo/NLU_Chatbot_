import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { auth } from '../middleware/auth.js';
import { requireAuth, requireApproval } from '../middleware/roleAuth.js';
import { convertJsonToYaml, validateTrainingData } from '../utils/jsonToYaml.js';
import huggingfaceService from '../services/huggingfaceService.js';
import { Dataset } from '../models/Dataset.js';
import { Project } from '../models/Project.js';

const router = express.Router();

// POST /api/training/workspace - Create a new workspace and project
router.post('/workspace', requireAuth, requireApproval, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspaceId = String(Date.now());
    const project = await Project.create({
      name: name,
      description: description || `Project for workspace ${workspaceId}`,
      ownerId: req.user._id,
      workspaceId: workspaceId,
      datasetIds: [],
      status: 'draft',
      currentModelVersion: '1.0.0',
      isActive: true
    });

    res.status(201).json({
      message: 'Workspace and project created successfully',
      workspace: {
        id: workspaceId,
        name: name,
        createdAt: new Date().toISOString()
      },
      project: {
        id: project._id,
        name: project.name,
        status: project.status
      }
    });
  } catch (error) {
    console.error('Workspace creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create workspace',
      error: error.message 
    });
  }
});

// Configure multer for file uploads
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

// POST /api/training/upload-and-train
// Upload JSON file, convert to YAML, and train model
router.post('/upload-and-train', requireAuth, requireApproval, upload.single('trainingData'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    console.log(`📁 Processing file: ${req.file.originalname} for workspace: ${workspaceId}`);

    // Read and parse JSON file
    const jsonContent = await fs.readFile(req.file.path, 'utf8');
    let jsonData;
    
    try {
      jsonData = JSON.parse(jsonContent);
    } catch (parseError) {
      await fs.remove(req.file.path); // Clean up uploaded file
      return res.status(400).json({ message: 'Invalid JSON format' });
    }

    // Validate training data
    const validation = validateTrainingData(jsonData);
    if (!validation.isValid) {
      await fs.remove(req.file.path); // Clean up uploaded file
      return res.status(400).json({ 
        message: 'Invalid training data format',
        errors: validation.errors,
        stats: validation.stats
      });
    }

    // Convert JSON to YAML
    const yamlPath = path.join('uploads', `training_${workspaceId}_${Date.now()}.yaml`);
    await convertJsonToYaml(jsonData, yamlPath);

    // Train model using HuggingFace
    const trainingResult = await huggingfaceService.trainModel(yamlPath, workspaceId);

    // Save dataset to database
    const uniqueIntents = [...new Set(jsonData.map(item => item.intent || item.Intent || item.label).filter(Boolean))];
    const intentCounts = {};
    uniqueIntents.forEach(intent => {
      intentCounts[intent] = jsonData.filter(item => (item.intent || item.Intent || item.label) === intent).length;
    });

    const dataset = await Dataset.create({
      name: req.file.originalname.replace('.json', ''),
      description: `Dataset uploaded for workspace ${workspaceId}`,
      ownerId: req.user._id,
      workspaceId: workspaceId,
      data: jsonData.map(item => ({
        text: item.text || item.Text || item.utterance || '',
        intent: item.intent || item.Intent || item.label || '',
        confidence: 1.0,
        isAnnotated: true,
        annotatedBy: req.user._id,
        annotatedAt: new Date()
      })),
      totalSamples: jsonData.length,
      uniqueIntents: uniqueIntents,
      intentCounts: intentCounts,
      isPublic: false,
      tags: ['training', 'uploaded'],
      version: '1.0.0',
      isActive: true
    });

    // Create or update project
    let project = await Project.findOne({ workspaceId: workspaceId, ownerId: req.user._id });
    if (!project) {
      project = await Project.create({
        name: `Project for ${workspaceId}`,
        description: `Project created for workspace ${workspaceId}`,
        ownerId: req.user._id,
        workspaceId: workspaceId,
        datasetIds: [dataset._id],
        status: 'trained',
        currentModelVersion: '1.0.0',
        performance: {
          accuracy: trainingResult.accuracy || 0,
          lastEvaluated: new Date()
        },
        isActive: true
      });
    } else {
      // Update existing project
      if (!project.datasetIds.includes(dataset._id)) {
        project.datasetIds.push(dataset._id);
      }
      project.status = 'trained';
      project.currentModelVersion = '1.0.0';
      if (trainingResult.accuracy) {
        project.performance = {
          ...project.performance,
          accuracy: trainingResult.accuracy,
          lastEvaluated: new Date()
        };
      }
      await project.save();
    }

    // Clean up temporary files
    await fs.remove(req.file.path);
    await fs.remove(yamlPath);

    res.status(200).json({
      message: 'Model trained successfully',
      dataset: {
        id: dataset._id,
        name: dataset.name,
        totalSamples: dataset.totalSamples,
        uniqueIntents: dataset.uniqueIntents.length
      },
      project: {
        id: project._id,
        name: project.name,
        status: project.status
      },
      ...trainingResult
    });

  } catch (error) {
    console.error('Training error:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }

    res.status(500).json({ 
      message: 'Training failed',
      error: error.message 
    });
  }
});

// POST /api/training/predict
// Predict intent for given text using trained model
router.post('/predict', requireAuth, requireApproval, async (req, res) => {
  try {
    const { text, workspaceId } = req.body;

    if (!text || !workspaceId) {
      return res.status(400).json({ message: 'text and workspaceId are required' });
    }

    const prediction = await huggingfaceService.predictIntent(text, workspaceId, req.user._id);

    res.json({
      message: 'Intent predicted successfully',
      ...prediction
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      message: 'Prediction failed',
      error: error.message 
    });
  }
});

// GET /api/training/model-info/:workspaceId
// Get information about trained model for a workspace
router.get('/model-info/:workspaceId', requireAuth, requireApproval, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const modelInfo = huggingfaceService.getModelInfo(workspaceId);

    if (!modelInfo) {
      return res.status(404).json({ message: 'No trained model found for this workspace' });
    }

    res.json({
      message: 'Model information retrieved successfully',
      model: {
        id: modelInfo.id,
        workspaceId: modelInfo.workspaceId,
        createdAt: modelInfo.createdAt,
        status: modelInfo.status,
        intents: modelInfo.intents,
        trainingExamples: modelInfo.trainingData.length
      }
    });

  } catch (error) {
    console.error('Model info error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve model information',
      error: error.message 
    });
  }
});

// GET /api/training/models
// List all trained models
router.get('/models', requireAuth, requireApproval, async (req, res) => {
  try {
    const models = huggingfaceService.listModels();

    res.json({
      message: 'Models retrieved successfully',
      models: models.map(model => ({
        id: model.id,
        workspaceId: model.workspaceId,
        createdAt: model.createdAt,
        status: model.status,
        intents: model.intents,
        trainingExamples: model.trainingData.length
      }))
    });

  } catch (error) {
    console.error('Models list error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve models',
      error: error.message 
    });
  }
});

// DELETE /api/training/model/:workspaceId
// Delete trained model for a workspace
router.delete('/model/:workspaceId', requireAuth, requireApproval, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const deleted = huggingfaceService.deleteModel(workspaceId);

    if (!deleted) {
      return res.status(404).json({ message: 'No trained model found for this workspace' });
    }

    res.json({
      message: 'Model deleted successfully',
      workspaceId
    });

  } catch (error) {
    console.error('Model deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete model',
      error: error.message 
    });
  }
});

// POST /api/training/submit-feedback - Submit feedback for a prediction
router.post('/submit-feedback', requireAuth, requireApproval, async (req, res) => {
  try {
    const {
      workspaceId,
      originalText,
      originalIntent,
      originalConfidence,
      correctedIntent,
      feedbackType = 'correction',
      feedbackText
    } = req.body;

    if (!workspaceId || !originalText || !originalIntent || !correctedIntent) {
      return res.status(400).json({ 
        message: 'workspaceId, originalText, originalIntent, and correctedIntent are required' 
      });
    }

    // Import Feedback model dynamically
    const { Feedback } = await import('../models/Feedback.js');

    const feedback = await Feedback.create({
      userId: req.user._id,
      workspaceId,
      originalText,
      originalIntent,
      originalConfidence: originalConfidence || 0,
      correctedIntent,
      feedbackType,
      feedbackText
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        status: feedback.status,
        submittedAt: feedback.createdAt
      }
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
