import { HfInference } from '@huggingface/inference';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

class HuggingFaceService {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.modelName = process.env.HUGGINGFACE_MODEL_NAME || 'microsoft/DialoGPT-medium';
    this.trainedModels = new Map(); // Cache for trained models
  }

  /**
   * Train a model using HuggingFace AutoTrain
   * @param {string} yamlPath - Path to the YAML training data
   * @param {string} workspaceId - Unique identifier for the workspace
   * @returns {Promise<Object>} - Training result
   */
  async trainModel(yamlPath, workspaceId) {
    try {
      console.log(`🚀 Starting model training for workspace: ${workspaceId}`);
      
      // Read YAML data
      const yamlData = await fs.readFile(yamlPath, 'utf8');
      
      // For this implementation, we'll use a text classification approach
      // In a real scenario, you would use HuggingFace AutoTrain or fine-tune a model
      const trainingData = this.parseYamlData(yamlData);
      
      // Simulate model training (replace with actual HuggingFace training)
      const modelId = `intent-classifier-${workspaceId}-${Date.now()}`;
      
      // Store model metadata
      const modelInfo = {
        id: modelId,
        workspaceId,
        trainingData: trainingData,
        createdAt: new Date().toISOString(),
        status: 'trained',
        intents: [...new Set(trainingData.map(item => item.label))]
      };

      this.trainedModels.set(workspaceId, modelInfo);
      
      console.log(`✅ Model training completed: ${modelId}`);
      console.log(`📊 Trained on ${trainingData.length} examples`);
      console.log(`🎯 Supports ${modelInfo.intents.length} intents`);

      return {
        success: true,
        modelId,
        workspaceId,
        intents: modelInfo.intents,
        trainingExamples: trainingData.length,
        message: 'Model trained successfully'
      };

    } catch (error) {
      console.error('❌ Model training failed:', error.message);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Predict intent for a given text using the trained model
   * @param {string} text - Input text to classify
   * @param {string} workspaceId - Workspace identifier
   * @returns {Promise<Object>} - Prediction result
   */
  async predictIntent(text, workspaceId) {
    try {
      const modelInfo = this.trainedModels.get(workspaceId);
      
      if (!modelInfo) {
        throw new Error(`No trained model found for workspace: ${workspaceId}`);
      }

      console.log(`🔍 Predicting intent for: "${text}"`);

      // Simple rule-based classification (replace with actual ML model)
      const prediction = this.classifyText(text, modelInfo.trainingData);
      
      const result = {
        text,
        predictedIntent: prediction.intent,
        confidence: prediction.confidence,
        alternatives: prediction.alternatives,
        workspaceId,
        modelId: modelInfo.id
      };

      console.log(`✅ Prediction: ${prediction.intent} (${(prediction.confidence * 100).toFixed(1)}%)`);

      return result;

    } catch (error) {
      console.error('❌ Intent prediction failed:', error.message);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Parse YAML training data
   * @param {string} yamlContent - YAML content as string
   * @returns {Array} - Parsed training data
   */
  parseYamlData(yamlContent) {
    try {
      const data = yaml.load(yamlContent);
      
      if (!data.data || !data.data.training) {
        throw new Error('Invalid YAML structure: Missing data.training section');
      }

      return data.data.training;
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
  }

  /**
   * Simple text classification using keyword matching and similarity
   * In production, this would use a trained ML model
   * @param {string} text - Input text
   * @param {Array} trainingData - Training examples
   * @returns {Object} - Classification result
   */
  classifyText(text, trainingData) {
    const textLower = text.toLowerCase();
    
    // Group training data by intent
    const intentGroups = {};
    trainingData.forEach(item => {
      if (!intentGroups[item.label]) {
        intentGroups[item.label] = [];
      }
      intentGroups[item.label].push(item.text.toLowerCase());
    });

    // Calculate similarity scores for each intent
    const scores = {};
    Object.keys(intentGroups).forEach(intent => {
      const examples = intentGroups[intent];
      let maxSimilarity = 0;
      
      examples.forEach(example => {
        const similarity = this.calculateSimilarity(textLower, example);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
      
      scores[intent] = maxSimilarity;
    });

    // Find best match
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a);

    const [predictedIntent, confidence] = sortedScores[0];
    const alternatives = sortedScores.slice(1, 4).map(([intent, score]) => ({
      intent,
      confidence: score
    }));

    return {
      intent: predictedIntent,
      confidence: Math.max(0.1, confidence), // Minimum confidence
      alternatives
    };
  }

  /**
   * Calculate text similarity using simple keyword overlap
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get model information for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Model information
   */
  getModelInfo(workspaceId) {
    return this.trainedModels.get(workspaceId) || null;
  }

  /**
   * List all trained models
   * @returns {Array} - List of model information
   */
  listModels() {
    return Array.from(this.trainedModels.values());
  }

  /**
   * Delete a trained model
   * @param {string} workspaceId - Workspace identifier
   * @returns {boolean} - Success status
   */
  deleteModel(workspaceId) {
    return this.trainedModels.delete(workspaceId);
  }
}

export default new HuggingFaceService();
