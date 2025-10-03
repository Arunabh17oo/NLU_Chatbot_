import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
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
    data: [{
      text: {
        type: String,
        required: true
      },
      intent: {
        type: String,
        required: true
      },
      confidence: {
        type: Number,
        default: 1.0
      },
      isAnnotated: {
        type: Boolean,
        default: false
      },
      annotatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      annotatedAt: {
        type: Date,
        default: null
      }
    }],
    totalSamples: {
      type: Number,
      default: 0
    },
    uniqueIntents: [String],
    intentCounts: {
      type: Map,
      of: Number
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [String],
    version: {
      type: String,
      default: '1.0.0'
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Dataset = mongoose.model('Dataset', datasetSchema);
