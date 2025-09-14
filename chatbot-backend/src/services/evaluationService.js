import fs from 'fs-extra';
import path from 'path';

class EvaluationService {
  constructor() {
    this.evaluationResults = new Map(); // Cache for evaluation results
  }

  /**
   * Evaluate model performance on test data
   * @param {Array} testData - Test dataset with true labels
   * @param {string} workspaceId - Workspace identifier
   * @param {string} modelId - Model identifier
   * @returns {Promise<Object>} - Evaluation metrics
   */
  async evaluateModel(testData, workspaceId, modelId) {
    try {
      console.log(`🔍 Evaluating model ${modelId} for workspace ${workspaceId}`);
      
      if (!testData || testData.length === 0) {
        throw new Error('Test data is required for evaluation');
      }

      // Validate test data format
      const validation = this.validateTestData(testData);
      if (!validation.isValid) {
        throw new Error(`Invalid test data: ${validation.errors.join(', ')}`);
      }

      // Get model predictions
      const predictions = await this.getModelPredictions(testData, workspaceId);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(testData, predictions);
      
      // Generate confusion matrix
      const confusionMatrix = this.generateConfusionMatrix(testData, predictions);
      
      // Store evaluation results
      const evaluationId = `eval_${workspaceId}_${modelId}_${Date.now()}`;
      const evaluationResult = {
        id: evaluationId,
        workspaceId,
        modelId,
        timestamp: new Date().toISOString(),
        metrics,
        confusionMatrix,
        testDataSize: testData.length,
        predictions: predictions.slice(0, 10) // Store first 10 predictions for review
      };

      this.evaluationResults.set(evaluationId, evaluationResult);
      
      console.log(`✅ Evaluation completed: ${evaluationId}`);
      console.log(`📊 Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      console.log(`📈 F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);

      return evaluationResult;

    } catch (error) {
      console.error('❌ Model evaluation failed:', error.message);
      throw new Error(`Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Validate test data format
   * @param {Array} testData - Test dataset
   * @returns {Object} - Validation result
   */
  validateTestData(testData) {
    const errors = [];
    
    if (!Array.isArray(testData)) {
      errors.push('Test data must be an array');
      return { isValid: false, errors };
    }

    if (testData.length === 0) {
      errors.push('Test data cannot be empty');
      return { isValid: false, errors };
    }

    // Check first few items for required fields
    const sampleSize = Math.min(5, testData.length);
    for (let i = 0; i < sampleSize; i++) {
      const item = testData[i];
      if (!item.text || typeof item.text !== 'string') {
        errors.push(`Item ${i}: Missing or invalid 'text' field`);
      }
      if (!item.label && !item.intent) {
        errors.push(`Item ${i}: Missing 'label' or 'intent' field`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        totalItems: testData.length,
        uniqueLabels: new Set(testData.map(item => item.label || item.intent)).size
      }
    };
  }

  /**
   * Get model predictions for test data
   * @param {Array} testData - Test dataset
   * @param {string} workspaceId - Workspace identifier
   * @returns {Promise<Array>} - Predictions array
   */
  async getModelPredictions(testData, workspaceId) {
    // Import huggingfaceService here to avoid circular dependency
    const huggingfaceService = (await import('./huggingfaceService.js')).default;
    
    const predictions = [];
    
    for (const item of testData) {
      try {
        const prediction = await huggingfaceService.predictIntent(item.text, workspaceId);
        predictions.push({
          text: item.text,
          trueLabel: item.label || item.intent,
          predictedLabel: prediction.predictedIntent,
          confidence: prediction.confidence
        });
      } catch (error) {
        console.warn(`Failed to predict for text: "${item.text}"`, error.message);
        predictions.push({
          text: item.text,
          trueLabel: item.label || item.intent,
          predictedLabel: 'unknown',
          confidence: 0
        });
      }
    }

    return predictions;
  }

  /**
   * Calculate evaluation metrics
   * @param {Array} testData - Test dataset with true labels
   * @param {Array} predictions - Model predictions
   * @returns {Object} - Calculated metrics
   */
  calculateMetrics(testData, predictions) {
    const trueLabels = testData.map(item => item.label || item.intent);
    const predictedLabels = predictions.map(pred => pred.predictedLabel);
    
    // Calculate accuracy
    const correctPredictions = predictions.filter((pred, index) => 
      pred.predictedLabel === trueLabels[index]
    ).length;
    const accuracy = correctPredictions / predictions.length;

    // Calculate precision, recall, and F1 score
    const uniqueLabels = [...new Set([...trueLabels, ...predictedLabels])];
    const metrics = {};

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalF1 = 0;
    let validLabels = 0;

    uniqueLabels.forEach(label => {
      const truePositives = predictions.filter((pred, index) => 
        pred.predictedLabel === label && trueLabels[index] === label
      ).length;
      
      const falsePositives = predictions.filter((pred, index) => 
        pred.predictedLabel === label && trueLabels[index] !== label
      ).length;
      
      const falseNegatives = predictions.filter((pred, index) => 
        pred.predictedLabel !== label && trueLabels[index] === label
      ).length;

      const precision = truePositives + falsePositives > 0 ? 
        truePositives / (truePositives + falsePositives) : 0;
      const recall = truePositives + falseNegatives > 0 ? 
        truePositives / (truePositives + falseNegatives) : 0;
      const f1 = precision + recall > 0 ? 
        2 * (precision * recall) / (precision + recall) : 0;

      metrics[label] = { precision, recall, f1 };

      if (truePositives + falsePositives + falseNegatives > 0) {
        totalPrecision += precision;
        totalRecall += recall;
        totalF1 += f1;
        validLabels++;
      }
    });

    const macroPrecision = validLabels > 0 ? totalPrecision / validLabels : 0;
    const macroRecall = validLabels > 0 ? totalRecall / validLabels : 0;
    const macroF1 = validLabels > 0 ? totalF1 / validLabels : 0;

    return {
      accuracy,
      macroPrecision,
      macroRecall,
      macroF1,
      f1Score: macroF1,
      perClassMetrics: metrics,
      totalPredictions: predictions.length,
      correctPredictions
    };
  }

  /**
   * Generate confusion matrix
   * @param {Array} testData - Test dataset with true labels
   * @param {Array} predictions - Model predictions
   * @returns {Object} - Confusion matrix data
   */
  generateConfusionMatrix(testData, predictions) {
    const trueLabels = testData.map(item => item.label || item.intent);
    const predictedLabels = predictions.map(pred => pred.predictedLabel);
    
    const uniqueLabels = [...new Set([...trueLabels, ...predictedLabels])].sort();
    
    const matrix = {};
    uniqueLabels.forEach(trueLabel => {
      matrix[trueLabel] = {};
      uniqueLabels.forEach(predLabel => {
        matrix[trueLabel][predLabel] = 0;
      });
    });

    // Fill confusion matrix
    predictions.forEach((pred, index) => {
      const trueLabel = trueLabels[index];
      const predLabel = pred.predictedLabel;
      matrix[trueLabel][predLabel]++;
    });

    return {
      labels: uniqueLabels,
      matrix,
      totalSamples: predictions.length
    };
  }

  /**
   * Get evaluation results for a model
   * @param {string} evaluationId - Evaluation identifier
   * @returns {Object|null} - Evaluation results
   */
  getEvaluationResult(evaluationId) {
    return this.evaluationResults.get(evaluationId) || null;
  }

  /**
   * List all evaluation results for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Array} - List of evaluation results
   */
  getWorkspaceEvaluations(workspaceId) {
    return Array.from(this.evaluationResults.values())
      .filter(evaluation => evaluation.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Compare multiple model evaluations
   * @param {Array} evaluationIds - Array of evaluation IDs to compare
   * @returns {Object} - Comparison results
   */
  compareEvaluations(evaluationIds) {
    const evaluations = evaluationIds.map(id => this.evaluationResults.get(id))
      .filter(evaluation => evaluation !== undefined);

    if (evaluations.length < 2) {
      throw new Error('At least 2 evaluations are required for comparison');
    }

    const comparison = {
      timestamp: new Date().toISOString(),
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        modelId: evaluation.modelId,
        timestamp: evaluation.timestamp,
        metrics: evaluation.metrics,
        testDataSize: evaluation.testDataSize
      })),
      bestAccuracy: evaluations.reduce((best, current) => 
        current.metrics.accuracy > best.metrics.accuracy ? current : best
      ),
      bestF1Score: evaluations.reduce((best, current) => 
        current.metrics.f1Score > best.metrics.f1Score ? current : best
      )
    };

    return comparison;
  }

  /**
   * Export evaluation results to JSON
   * @param {string} evaluationId - Evaluation identifier
   * @returns {Object} - Exportable evaluation data
   */
  exportEvaluation(evaluationId) {
    const evaluation = this.evaluationResults.get(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return {
      evaluationId: evaluation.id,
      workspaceId: evaluation.workspaceId,
      modelId: evaluation.modelId,
      timestamp: evaluation.timestamp,
      metrics: evaluation.metrics,
      confusionMatrix: evaluation.confusionMatrix,
      testDataSize: evaluation.testDataSize,
      samplePredictions: evaluation.predictions
    };
  }
}

export default new EvaluationService();
