import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 1000
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workspaceId: {
      type: String,
      required: true
    },
    datasetIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset'
    }],
    modelConfig: {
      modelName: {
        type: String,
        default: 'microsoft/DialoGPT-medium'
      },
      maxLength: {
        type: Number,
        default: 512
      },
      learningRate: {
        type: Number,
        default: 0.001
      },
      epochs: {
        type: Number,
        default: 3
      },
      batchSize: {
        type: Number,
        default: 16
      }
    },
    status: {
      type: String,
      enum: ['draft', 'training', 'trained', 'deployed', 'archived'],
      default: 'draft'
    },
    currentModelVersion: {
      type: String,
      default: '1.0.0'
    },
    performance: {
      accuracy: Number,
      f1Score: Number,
      precision: Number,
      recall: Number,
      lastEvaluated: Date
    },
    collaborators: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
