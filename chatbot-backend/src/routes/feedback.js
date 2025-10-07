import express from 'express';
import { Feedback } from '../models/Feedback.js';
import { requireAuth, requireApproval, requireAdmin } from '../middleware/roleAuth.js';

const router = express.Router();

// POST /api/feedback/submit - Submit feedback
router.post('/submit', requireAuth, requireApproval, async (req, res) => {
  try {
    const {
      workspaceId,
      originalText,
      originalIntent,
      originalConfidence,
      correctedIntent,
      feedbackType,
      feedbackText
    } = req.body;

    if (!workspaceId || !originalText || !originalIntent || !correctedIntent) {
      return res.status(400).json({ 
        message: 'workspaceId, originalText, originalIntent, and correctedIntent are required' 
      });
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      workspaceId,
      originalText,
      originalIntent,
      originalConfidence: originalConfidence || 0,
      correctedIntent,
      feedbackType: feedbackType || 'correction',
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

// GET /api/feedback/user - Get user's feedback
router.get('/user', requireAuth, requireApproval, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, workspaceId } = req.query;
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (workspaceId) query.workspaceId = workspaceId;

    const feedbacks = await Feedback.find(query)
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get user feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/admin - Get all feedback (admin only)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, workspaceId, feedbackType } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (workspaceId) query.workspaceId = workspaceId;
    if (feedbackType) query.feedbackType = feedbackType;

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get admin feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/feedback/:feedbackId/review - Review feedback (admin only)
router.put('/:feedbackId/review', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, feedbackText } = req.body;

    if (!['pending', 'reviewed', 'applied', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    feedback.reviewedBy = req.user._id;
    feedback.reviewedAt = new Date();
    if (feedbackText) feedback.feedbackText = feedbackText;

    await feedback.save();

    res.json({
      message: 'Feedback reviewed successfully',
      feedback: {
        id: feedback._id,
        status: feedback.status,
        reviewedAt: feedback.reviewedAt
      }
    });
  } catch (err) {
    console.error('Review feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/feedback/:feedbackId/retrain - Mark feedback as retrained
router.put('/:feedbackId/retrain', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.isRetrained = true;
    feedback.retrainedAt = new Date();
    feedback.status = 'applied';

    await feedback.save();

    res.json({
      message: 'Feedback marked as retrained',
      feedback: {
        id: feedback._id,
        isRetrained: feedback.isRetrained,
        retrainedAt: feedback.retrainedAt
      }
    });
  } catch (err) {
    console.error('Mark retrained error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/stats - Get feedback statistics (admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const query = workspaceId ? { workspaceId } : {};

    const stats = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalFeedbacks = await Feedback.countDocuments(query);
    const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
    const reviewedCount = stats.find(s => s._id === 'reviewed')?.count || 0;
    const appliedCount = stats.find(s => s._id === 'applied')?.count || 0;
    const rejectedCount = stats.find(s => s._id === 'rejected')?.count || 0;

    res.json({
      total: totalFeedbacks,
      pending: pendingCount,
      reviewed: reviewedCount,
      applied: appliedCount,
      rejected: rejectedCount,
      stats
    });
  } catch (err) {
    console.error('Get feedback stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/suggestions/:text - Get correct intent suggestions for a text
router.get('/suggestions/:text', requireAuth, requireApproval, async (req, res) => {
  try {
    const { text } = req.params;
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // Find feedback entries that match the text and have corrected intents
    const feedbacks = await Feedback.find({
      originalText: { $regex: text, $options: 'i' }, // Case-insensitive match
      workspaceId: workspaceId,
      correctedIntent: { $exists: true, $ne: null },
      status: { $in: ['reviewed', 'applied'] }
    })
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

    // Group by corrected intent and count occurrences
    const intentCounts = {};
    feedbacks.forEach(feedback => {
      const intent = feedback.correctedIntent;
      if (!intentCounts[intent]) {
        intentCounts[intent] = {
          intent: intent,
          count: 0,
          confidence: 0,
          examples: []
        };
      }
      intentCounts[intent].count++;
      intentCounts[intent].examples.push({
        text: feedback.originalText,
        correctedBy: feedback.userId?.username || 'Unknown',
        correctedAt: feedback.createdAt
      });
    });

    // Convert to array and sort by count (most frequent first)
    const suggestions = Object.values(intentCounts)
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        ...item,
        confidence: Math.min(item.count / feedbacks.length, 1) // Confidence based on frequency
      }));

    res.json({
      text: text,
      suggestions: suggestions,
      totalFeedbacks: feedbacks.length
    });
  } catch (err) {
    console.error('Get intent suggestions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
