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
   * @param {string} userId - User identifier for active learning
   * @returns {Promise<Object>} - Prediction result
   */
  async predictIntent(text, workspaceId, userId = null) {
    try {
      let modelInfo = this.trainedModels.get(workspaceId);
      
      if (!modelInfo) {
        // Try to load model from database
        console.log(`🔄 Loading model from database for workspace: ${workspaceId}`);
        const { Dataset } = await import('../models/Dataset.js');
        
        const dataset = await Dataset.findOne({ 
          workspaceId: workspaceId, 
          isActive: true 
        }).sort({ createdAt: -1 });

        if (!dataset) {
          throw new Error(`No trained model found for workspace: ${workspaceId}`);
        }

        // Create model info from database data
        modelInfo = {
          id: `intent-classifier-${workspaceId}-${dataset._id}`,
          workspaceId,
          trainingData: dataset.data,
          intents: dataset.uniqueIntents,
          createdAt: dataset.createdAt,
          status: 'trained'
        };

        // Cache the model info
        this.trainedModels.set(workspaceId, modelInfo);
        console.log(`✅ Model loaded from database and cached`);
      }

      console.log(`🔍 Predicting intent for: "${text}"`);

      // Simple rule-based classification (replace with actual ML model)
      const prediction = this.classifyText(text, modelInfo.trainingData);
      
      // Calculate uncertainty score (inverse of confidence)
      const uncertaintyScore = 1 - prediction.confidence;
      
      const result = {
        text,
        predictedIntent: prediction.intent,
        confidence: prediction.confidence,
        uncertaintyScore: uncertaintyScore,
        alternatives: prediction.alternatives,
        workspaceId,
        modelId: modelInfo.id,
        isUncertain: uncertaintyScore > 0.8 // Threshold for uncertainty (80%)
      };

      console.log(`✅ Prediction: ${prediction.intent} (${(prediction.confidence * 100).toFixed(1)}%)`);
      console.log(`📊 Uncertainty: ${(uncertaintyScore * 100).toFixed(1)}%`);

      // If prediction is uncertain and user is provided, add to active learning queue
      if (result.isUncertain && userId) {
        await this.addToActiveLearningQueue(text, prediction.intent, prediction.confidence, uncertaintyScore, workspaceId, userId);
      }

      return result;

    } catch (error) {
      console.error('❌ Intent prediction failed:', error.message);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Add uncertain sample to active learning queue
   * @param {string} text - Input text
   * @param {string} predictedIntent - Predicted intent
   * @param {number} confidence - Confidence score
   * @param {number} uncertaintyScore - Uncertainty score
   * @param {string} workspaceId - Workspace identifier
   * @param {string} userId - User identifier
   */
  async addToActiveLearningQueue(text, predictedIntent, confidence, uncertaintyScore, workspaceId, userId) {
    try {
      // Import ActiveLearning model dynamically to avoid circular dependencies
      const { ActiveLearning } = await import('../models/ActiveLearning.js');
      
      // Check if sample already exists
      const existingSample = await ActiveLearning.findOne({
        text: text,
        workspaceId: workspaceId,
        status: { $in: ['pending', 'reviewed'] }
      });

      if (!existingSample) {
        // Determine priority based on uncertainty score
        let priority = 'medium';
        if (uncertaintyScore > 0.8) priority = 'urgent';
        else if (uncertaintyScore > 0.6) priority = 'high';
        else if (uncertaintyScore < 0.3) priority = 'low';

        await ActiveLearning.create({
          userId: userId,
          workspaceId: workspaceId,
          text: text,
          predictedIntent: predictedIntent,
          confidence: confidence,
          uncertaintyScore: uncertaintyScore,
          priority: priority,
          status: 'pending'
        });

        console.log(`📝 Added uncertain sample to active learning queue: "${text}" (${(uncertaintyScore * 100).toFixed(1)}% uncertain)`);
      }
    } catch (error) {
      console.error('❌ Failed to add sample to active learning queue:', error.message);
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
    
    console.log(`🔍 Classifying text: "${text}"`);
    console.log(`📊 Training data length: ${trainingData.length}`);
    console.log(`📋 Sample training data:`, trainingData.slice(0, 3));
    
    // Group training data by intent
    const intentGroups = {};
    trainingData.forEach(item => {
      // Handle both 'label' and 'intent' properties for backward compatibility
      const intent = item.intent || item.label;
      if (!intent) {
        console.log(`⚠️ Skipping item without intent/label:`, item);
        return; // Skip items without intent/label
      }
      
      if (!intentGroups[intent]) {
        intentGroups[intent] = [];
      }
      intentGroups[intent].push(item.text.toLowerCase());
    });
    
    console.log(`🎯 Intent groups:`, Object.keys(intentGroups));

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

    console.log(`📈 Similarity scores:`, scores);
    console.log(`🏆 Sorted scores:`, sortedScores);

    const [predictedIntent, confidence] = sortedScores[0] || ['unknown', 0];
    const alternatives = sortedScores.slice(1, 4).map(([intent, score]) => ({
      intent,
      confidence: score
    }));

    console.log(`✅ Final prediction: "${predictedIntent}" with confidence ${(confidence * 100).toFixed(1)}%`);

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
   * Retrain model with correct intent for a specific text
   * @param {string} text - Input text
   * @param {string} correctIntent - Correct intent from feedback
   * @param {string} workspaceId - Workspace identifier
   * @returns {Promise<Object>} - Retraining result
   */
  async retrainModelWithCorrectIntent(text, correctIntent, workspaceId) {
    try {
      console.log(`🔄 Retraining model for: "${text}" with correct intent: "${correctIntent}"`);

      // Import Dataset model dynamically to avoid circular dependencies
      const { Dataset } = await import('../models/Dataset.js');

      // Find the most recent dataset for this workspace
      const dataset = await Dataset.findOne({ 
        workspaceId: workspaceId, 
        isActive: true 
      }).sort({ createdAt: -1 });

      if (!dataset) {
        throw new Error(`No training dataset found for workspace: ${workspaceId}`);
      }

      console.log(`📊 Found dataset with ${dataset.data.length} existing examples`);

      // Check if this exact text-intent combination already exists
      const existingIndex = dataset.data.findIndex(
        item => item.text === text && item.intent === correctIntent
      );

      if (existingIndex === -1) {
        // Add new example to the dataset
        dataset.data.push({
          text: text,
          intent: correctIntent,
          confidence: 1.0,
          isAnnotated: true,
          annotatedAt: new Date()
        });

        // Update dataset statistics
        dataset.totalSamples = dataset.data.length;
        
        // Update unique intents
        const uniqueIntents = [...new Set(dataset.data.map(item => item.intent))];
        dataset.uniqueIntents = uniqueIntents;

        // Update intent counts
        const intentCounts = {};
        dataset.data.forEach(item => {
          intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
        });
        dataset.intentCounts = intentCounts;

        // Update last modified
        dataset.lastModified = new Date();

        // Save the updated dataset
        await dataset.save();

        console.log(`✅ Added new training example: "${text}" -> "${correctIntent}"`);
        console.log(`📊 Total training examples: ${dataset.data.length}`);
        console.log(`🎯 Unique intents: ${dataset.uniqueIntents.length}`);
      } else {
        console.log(`ℹ️ Training example already exists: "${text}" -> "${correctIntent}"`);
      }

      // Update in-memory model cache if it exists
      let modelInfo = this.trainedModels.get(workspaceId);
      if (modelInfo) {
        modelInfo.trainingData = dataset.data;
        modelInfo.intents = dataset.uniqueIntents;
        modelInfo.lastRetrained = new Date();
        modelInfo.retrainCount = (modelInfo.retrainCount || 0) + 1;
        this.trainedModels.set(workspaceId, modelInfo);
      } else {
        // Create a new model info entry for the cache
        modelInfo = {
          id: `intent-classifier-${workspaceId}-${Date.now()}`,
          workspaceId,
          trainingData: dataset.data,
          intents: dataset.uniqueIntents,
          createdAt: dataset.createdAt,
          lastRetrained: new Date(),
          retrainCount: 1,
          status: 'trained'
        };
        this.trainedModels.set(workspaceId, modelInfo);
      }

      console.log(`🎯 Model retrained successfully for workspace: ${workspaceId}`);
      console.log(`📊 Total training examples: ${dataset.data.length}`);

      return {
        success: true,
        text: text,
        correctIntent: correctIntent,
        totalExamples: dataset.data.length,
        uniqueIntents: dataset.uniqueIntents.length,
        retrainedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Model retraining failed:', error.message);
      throw new Error(`Model retraining failed: ${error.message}`);
    }
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
