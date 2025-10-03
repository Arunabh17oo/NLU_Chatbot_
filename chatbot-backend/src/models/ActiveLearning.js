import mongoose from 'mongoose';

const activeLearningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workspaceId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    predictedIntent: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    uncertaintyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'annotated', 'retrained'],
      default: 'pending'
    },
    correctIntent: {
      type: String,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    annotationNotes: {
      type: String,
      maxlength: 500
    },
    isRetrained: {
      type: Boolean,
      default: false
    },
    retrainedAt: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  { timestamps: true }
);

export const ActiveLearning = mongoose.model('ActiveLearning', activeLearningSchema);
