import express from 'express';
import { auth } from '../middleware/auth.js';
import modelVersioningService from '../services/modelVersioningService.js';
import huggingfaceService from '../services/huggingfaceService.js';

const router = express.Router();

// GET /api/model-versioning/versions/:workspaceId
// Get all model versions for a workspace
router.get('/versions/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const versions = modelVersioningService.getWorkspaceVersions(workspaceId);

    res.json({
      message: 'Model versions retrieved successfully',
      versions: versions.map(version => ({
        id: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt,
        status: version.status,
        intents: version.modelData.intents,
        trainingExamples: version.modelData.trainingExamples,
        evaluationResults: version.evaluationResults ? {
          accuracy: version.evaluationResults.metrics.accuracy,
          f1Score: version.evaluationResults.metrics.f1Score,
          testDataSize: version.evaluationResults.testDataSize
        } : null,
        metadata: version.metadata
      }))
    });

  } catch (error) {
    console.error('Get model versions error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve model versions',
      error: error.message 
    });
  }
});

// GET /api/model-versioning/active/:workspaceId
// Get active model version for a workspace
router.get('/active/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const activeVersion = modelVersioningService.getActiveVersion(workspaceId);

    if (!activeVersion) {
      return res.status(404).json({ message: 'No active model version found for this workspace' });
    }

    res.json({
      message: 'Active model version retrieved successfully',
      version: {
        id: activeVersion.id,
        versionNumber: activeVersion.versionNumber,
        createdAt: activeVersion.createdAt,
        status: activeVersion.status,
        intents: activeVersion.modelData.intents,
        trainingExamples: activeVersion.modelData.trainingExamples,
        evaluationResults: activeVersion.evaluationResults,
        metadata: activeVersion.metadata
      }
    });

  } catch (error) {
    console.error('Get active version error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve active model version',
      error: error.message 
    });
  }
});

// GET /api/model-versioning/version/:versionId
// Get specific model version by ID
router.get('/version/:versionId', auth, async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = modelVersioningService.getModelVersion(versionId);

    if (!version) {
      return res.status(404).json({ message: 'Model version not found' });
    }

    res.json({
      message: 'Model version retrieved successfully',
      version
    });

  } catch (error) {
    console.error('Get model version error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve model version',
      error: error.message 
    });
  }
});

// POST /api/model-versioning/create
// Create a new model version
router.post('/create', auth, async (req, res) => {
  try {
    const { workspaceId, modelId, description, tags } = req.body;
    
    if (!workspaceId || !modelId) {
      return res.status(400).json({ message: 'workspaceId and modelId are required' });
    }

    // Get model information from huggingface service
    const modelInfo = huggingfaceService.getModelInfo(workspaceId);
    if (!modelInfo) {
      return res.status(404).json({ message: 'Model not found for this workspace' });
    }

    const versionData = {
      modelId,
      intents: modelInfo.intents,
      trainingExamples: modelInfo.trainingData.length,
      trainingData: modelInfo.trainingData.slice(0, 10), // Store sample
      description: description || `Model version created manually`,
      tags: tags || ['manual'],
      createdBy: req.user?.id || 'system'
    };

    const modelVersion = await modelVersioningService.createModelVersion(workspaceId, versionData);

    res.status(201).json({
      message: 'Model version created successfully',
      version: {
        id: modelVersion.id,
        versionNumber: modelVersion.versionNumber,
        createdAt: modelVersion.createdAt,
        status: modelVersion.status,
        metadata: modelVersion.metadata
      }
    });

  } catch (error) {
    console.error('Create model version error:', error);
    res.status(500).json({ 
      message: 'Failed to create model version',
      error: error.message 
    });
  }
});

// PUT /api/model-versioning/version/:versionId
// Update model version metadata
router.put('/version/:versionId', auth, async (req, res) => {
  try {
    const { versionId } = req.params;
    const { description, tags } = req.body;

    const updates = {};
    if (description) updates.description = description;
    if (tags) updates.tags = tags;

    const updatedVersion = modelVersioningService.updateModelVersion(versionId, updates);

    res.json({
      message: 'Model version updated successfully',
      version: {
        id: updatedVersion.id,
        versionNumber: updatedVersion.versionNumber,
        metadata: updatedVersion.metadata
      }
    });

  } catch (error) {
    console.error('Update model version error:', error);
    res.status(500).json({ 
      message: 'Failed to update model version',
      error: error.message 
    });
  }
});

// POST /api/model-versioning/compare
// Compare multiple model versions
router.post('/compare', auth, async (req, res) => {
  try {
    const { versionIds } = req.body;
    
    if (!versionIds || !Array.isArray(versionIds) || versionIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 version IDs are required' });
    }

    const comparison = modelVersioningService.compareVersions(versionIds);

    res.json({
      message: 'Model version comparison completed successfully',
      comparison
    });

  } catch (error) {
    console.error('Model version comparison error:', error);
    res.status(500).json({ 
      message: 'Model version comparison failed',
      error: error.message 
    });
  }
});

// DELETE /api/model-versioning/version/:versionId
// Delete model version
router.delete('/version/:versionId', auth, async (req, res) => {
  try {
    const { versionId } = req.params;
    const deleted = modelVersioningService.deleteModelVersion(versionId);

    if (!deleted) {
      return res.status(404).json({ message: 'Model version not found' });
    }

    res.json({
      message: 'Model version deleted successfully',
      versionId
    });

  } catch (error) {
    console.error('Delete model version error:', error);
    res.status(500).json({ 
      message: 'Failed to delete model version',
      error: error.message 
    });
  }
});

// GET /api/model-versioning/export/:versionId
// Export model version data
router.get('/export/:versionId', auth, async (req, res) => {
  try {
    const { versionId } = req.params;
    const exportData = modelVersioningService.exportModelVersion(versionId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="model_version_${versionId}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export model version error:', error);
    res.status(500).json({ 
      message: 'Export failed',
      error: error.message 
    });
  }
});

// GET /api/model-versioning/statistics
// Get model versioning statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const stats = modelVersioningService.getVersionStatistics(workspaceId);

    res.json({
      message: 'Statistics retrieved successfully',
      statistics: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve statistics',
      error: error.message 
    });
  }
});

export default router;
