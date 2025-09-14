import fs from 'fs-extra';
import path from 'path';

class ModelVersioningService {
  constructor() {
    this.modelVersions = new Map(); // Cache for model versions
    this.versionHistory = new Map(); // Track version history per workspace
  }

  /**
   * Create a new model version
   * @param {string} workspaceId - Workspace identifier
   * @param {Object} modelData - Model information and training data
   * @param {Object} evaluationResults - Evaluation metrics (optional)
   * @returns {Object} - Version information
   */
  async createModelVersion(workspaceId, modelData, evaluationResults = null) {
    try {
      console.log(`📝 Creating new model version for workspace: ${workspaceId}`);
      
      const versionNumber = this.getNextVersionNumber(workspaceId);
      const versionId = `v${versionNumber}_${workspaceId}_${Date.now()}`;
      
      const modelVersion = {
        id: versionId,
        workspaceId,
        versionNumber,
        createdAt: new Date().toISOString(),
        status: 'active',
        modelData: {
          modelId: modelData.modelId,
          intents: modelData.intents,
          trainingExamples: modelData.trainingExamples,
          trainingData: modelData.trainingData
        },
        evaluationResults,
        metadata: {
          description: modelData.description || `Model version ${versionNumber}`,
          tags: modelData.tags || [],
          createdBy: modelData.createdBy || 'system'
        }
      };

      // Store version
      this.modelVersions.set(versionId, modelVersion);
      
      // Update version history
      if (!this.versionHistory.has(workspaceId)) {
        this.versionHistory.set(workspaceId, []);
      }
      this.versionHistory.get(workspaceId).push(versionId);
      
      // Mark previous versions as inactive
      this.markPreviousVersionsInactive(workspaceId, versionId);
      
      console.log(`✅ Model version created: ${versionId}`);
      console.log(`📊 Version ${versionNumber} for workspace ${workspaceId}`);

      return modelVersion;

    } catch (error) {
      console.error('❌ Model versioning failed:', error.message);
      throw new Error(`Versioning failed: ${error.message}`);
    }
  }

  /**
   * Get next version number for workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {number} - Next version number
   */
  getNextVersionNumber(workspaceId) {
    const history = this.versionHistory.get(workspaceId) || [];
    return history.length + 1;
  }

  /**
   * Mark previous versions as inactive
   * @param {string} workspaceId - Workspace identifier
   * @param {string} currentVersionId - Current active version ID
   */
  markPreviousVersionsInactive(workspaceId, currentVersionId) {
    const history = this.versionHistory.get(workspaceId) || [];
    
    history.forEach(versionId => {
      if (versionId !== currentVersionId) {
        const version = this.modelVersions.get(versionId);
        if (version) {
          version.status = 'inactive';
        }
      }
    });
  }

  /**
   * Get model version by ID
   * @param {string} versionId - Version identifier
   * @returns {Object|null} - Model version information
   */
  getModelVersion(versionId) {
    return this.modelVersions.get(versionId) || null;
  }

  /**
   * Get all versions for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Array} - List of model versions
   */
  getWorkspaceVersions(workspaceId) {
    const history = this.versionHistory.get(workspaceId) || [];
    return history.map(versionId => this.modelVersions.get(versionId))
      .filter(version => version !== undefined)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Get active version for workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Active model version
   */
  getActiveVersion(workspaceId) {
    const versions = this.getWorkspaceVersions(workspaceId);
    return versions.find(version => version.status === 'active') || null;
  }

  /**
   * Compare model versions
   * @param {Array} versionIds - Array of version IDs to compare
   * @returns {Object} - Comparison results
   */
  compareVersions(versionIds) {
    const versions = versionIds.map(id => this.modelVersions.get(id))
      .filter(version => version !== undefined);

    if (versions.length < 2) {
      throw new Error('At least 2 versions are required for comparison');
    }

    const comparison = {
      timestamp: new Date().toISOString(),
      versions: versions.map(version => ({
        id: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt,
        status: version.status,
        intents: version.modelData.intents,
        trainingExamples: version.modelData.trainingExamples,
        evaluationResults: version.evaluationResults,
        metadata: version.metadata
      })),
      summary: {
        totalVersions: versions.length,
        activeVersions: versions.filter(v => v.status === 'active').length,
        latestVersion: versions.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        )
      }
    };

    // Add performance comparison if evaluation results are available
    const versionsWithEvaluation = versions.filter(v => v.evaluationResults);
    if (versionsWithEvaluation.length >= 2) {
      comparison.performanceComparison = {
        bestAccuracy: versionsWithEvaluation.reduce((best, current) => 
          current.evaluationResults.metrics.accuracy > best.evaluationResults.metrics.accuracy ? current : best
        ),
        bestF1Score: versionsWithEvaluation.reduce((best, current) => 
          current.evaluationResults.metrics.f1Score > best.evaluationResults.metrics.f1Score ? current : best
        )
      };
    }

    return comparison;
  }

  /**
   * Update model version metadata
   * @param {string} versionId - Version identifier
   * @param {Object} updates - Metadata updates
   * @returns {Object} - Updated model version
   */
  updateModelVersion(versionId, updates) {
    const version = this.modelVersions.get(versionId);
    if (!version) {
      throw new Error('Model version not found');
    }

    // Update metadata
    version.metadata = {
      ...version.metadata,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Model version updated: ${versionId}`);
    return version;
  }

  /**
   * Delete model version
   * @param {string} versionId - Version identifier
   * @returns {boolean} - Success status
   */
  deleteModelVersion(versionId) {
    const version = this.modelVersions.get(versionId);
    if (!version) {
      return false;
    }

    // Remove from version history
    const history = this.versionHistory.get(version.workspaceId) || [];
    const updatedHistory = history.filter(id => id !== versionId);
    this.versionHistory.set(version.workspaceId, updatedHistory);

    // Remove version
    this.modelVersions.delete(versionId);

    console.log(`✅ Model version deleted: ${versionId}`);
    return true;
  }

  /**
   * Export model version data
   * @param {string} versionId - Version identifier
   * @returns {Object} - Exportable model data
   */
  exportModelVersion(versionId) {
    const version = this.modelVersions.get(versionId);
    if (!version) {
      throw new Error('Model version not found');
    }

    return {
      versionId: version.id,
      workspaceId: version.workspaceId,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      status: version.status,
      modelData: version.modelData,
      evaluationResults: version.evaluationResults,
      metadata: version.metadata
    };
  }

  /**
   * Get model version statistics
   * @param {string} workspaceId - Workspace identifier (optional)
   * @returns {Object} - Statistics
   */
  getVersionStatistics(workspaceId = null) {
    const versions = workspaceId ? 
      this.getWorkspaceVersions(workspaceId) : 
      Array.from(this.modelVersions.values());

    const stats = {
      totalVersions: versions.length,
      activeVersions: versions.filter(v => v.status === 'active').length,
      inactiveVersions: versions.filter(v => v.status === 'inactive').length,
      workspaces: workspaceId ? 1 : new Set(versions.map(v => v.workspaceId)).size,
      averageIntents: versions.length > 0 ? 
        versions.reduce((sum, v) => sum + v.modelData.intents.length, 0) / versions.length : 0,
      averageTrainingExamples: versions.length > 0 ? 
        versions.reduce((sum, v) => sum + v.modelData.trainingExamples, 0) / versions.length : 0
    };

    return stats;
  }
}

export default new ModelVersioningService();
