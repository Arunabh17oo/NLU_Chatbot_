import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    originalText: {
      type: String,
      required: true
    },
    originalIntent: {
      type: String,
      required: true
    },
    originalConfidence: {
      type: Number,
      required: true
    },
    correctedIntent: {
      type: String,
      required: true
    },
    feedbackType: {
      type: String,
      enum: ['correction', 'suggestion', 'complaint'],
      default: 'correction'
    },
    feedbackText: {
      type: String,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'applied', 'rejected'],
      default: 'pending'
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
    isRetrained: {
      type: Boolean,
      default: false
    },
    retrainedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
