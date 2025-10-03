import express from 'express';
import { ActiveLearning } from '../models/ActiveLearning.js';
import { requireAuth, requireApproval, requireAdmin } from '../middleware/roleAuth.js';

const router = express.Router();

// POST /api/active-learning/add-uncertain - Add uncertain sample
router.post('/add-uncertain', requireAuth, requireApproval, async (req, res) => {
  try {
    const {
      workspaceId,
      text,
      predictedIntent,
      confidence,
      uncertaintyScore,
      priority = 'medium'
    } = req.body;

    if (!workspaceId || !text || !predictedIntent || confidence === undefined || uncertaintyScore === undefined) {
      return res.status(400).json({ 
        message: 'workspaceId, text, predictedIntent, confidence, and uncertaintyScore are required' 
      });
    }

    const activeLearning = await ActiveLearning.create({
      userId: req.user._id,
      workspaceId,
      text,
      predictedIntent,
      confidence,
      uncertaintyScore,
      priority
    });

    res.status(201).json({
      message: 'Uncertain sample added successfully',
      sample: {
        id: activeLearning._id,
        text: activeLearning.text,
        uncertaintyScore: activeLearning.uncertaintyScore,
        priority: activeLearning.priority,
        status: activeLearning.status
      }
    });
  } catch (err) {
    console.error('Add uncertain sample error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/active-learning/queue - Get uncertain samples queue
router.get('/queue', requireAuth, requireApproval, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'pending', 
      priority, 
      workspaceId,
      userId 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (workspaceId) query.workspaceId = workspaceId;
    if (userId) query.userId = userId;

    // If not admin, only show user's own samples
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const samples = await ActiveLearning.find(query)
      .populate('userId', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ 
        priority: { high: 1, urgent: 1, medium: 2, low: 3 },
        uncertaintyScore: -1,
        createdAt: -1 
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActiveLearning.countDocuments(query);

    res.json({
      samples,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get queue error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/active-learning/:sampleId/annotate - Annotate uncertain sample
router.put('/:sampleId/annotate', requireAuth, requireApproval, async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { correctIntent, annotationNotes, priority } = req.body;

    if (!correctIntent) {
      return res.status(400).json({ message: 'correctIntent is required' });
    }

    const sample = await ActiveLearning.findById(sampleId);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    // Check if user can annotate this sample
    if (req.user.role !== 'admin' && sample.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    sample.correctIntent = correctIntent;
    sample.status = 'annotated';
    sample.reviewedBy = req.user._id;
    sample.reviewedAt = new Date();
    if (annotationNotes) sample.annotationNotes = annotationNotes;
    if (priority) sample.priority = priority;

    await sample.save();

    res.json({
      message: 'Sample annotated successfully',
      sample: {
        id: sample._id,
        correctIntent: sample.correctIntent,
        status: sample.status,
        annotatedAt: sample.reviewedAt
      }
    });
  } catch (err) {
    console.error('Annotate sample error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/active-learning/:sampleId/retrain - Mark sample as retrained
router.put('/:sampleId/retrain', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sampleId } = req.params;

    const sample = await ActiveLearning.findById(sampleId);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    sample.isRetrained = true;
    sample.retrainedAt = new Date();
    sample.status = 'retrained';

    await sample.save();

    res.json({
      message: 'Sample marked as retrained',
      sample: {
        id: sample._id,
        isRetrained: sample.isRetrained,
        retrainedAt: sample.retrainedAt
      }
    });
  } catch (err) {
    console.error('Mark retrained error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/active-learning/batch-annotate - Batch annotate samples
router.post('/batch-annotate', requireAuth, requireApproval, async (req, res) => {
  try {
    const { annotations } = req.body;

    if (!Array.isArray(annotations) || annotations.length === 0) {
      return res.status(400).json({ message: 'annotations array is required' });
    }

    const results = [];
    
    for (const annotation of annotations) {
      const { sampleId, correctIntent, annotationNotes, priority } = annotation;
      
      const sample = await ActiveLearning.findById(sampleId);
      if (!sample) {
        results.push({ sampleId, success: false, error: 'Sample not found' });
        continue;
      }

      // Check permissions
      if (req.user.role !== 'admin' && sample.userId.toString() !== req.user._id.toString()) {
        results.push({ sampleId, success: false, error: 'Access denied' });
        continue;
      }

      sample.correctIntent = correctIntent;
      sample.status = 'annotated';
      sample.reviewedBy = req.user._id;
      sample.reviewedAt = new Date();
      if (annotationNotes) sample.annotationNotes = annotationNotes;
      if (priority) sample.priority = priority;

      await sample.save();
      results.push({ sampleId, success: true });
    }

    res.json({
      message: 'Batch annotation completed',
      results
    });
  } catch (err) {
    console.error('Batch annotate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/active-learning/stats - Get active learning statistics
router.get('/stats', requireAuth, requireApproval, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const query = workspaceId ? { workspaceId } : {};

    // If not admin, only show user's stats
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const stats = await ActiveLearning.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await ActiveLearning.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSamples = await ActiveLearning.countDocuments(query);
    const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
    const annotatedCount = stats.find(s => s._id === 'annotated')?.count || 0;
    const retrainedCount = stats.find(s => s._id === 'retrained')?.count || 0;

    res.json({
      total: totalSamples,
      pending: pendingCount,
      annotated: annotatedCount,
      retrained: retrainedCount,
      statusStats: stats,
      priorityStats: priorityStats
    });
  } catch (err) {
    console.error('Get active learning stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/active-learning/:sampleId - Delete uncertain sample
router.delete('/:sampleId', requireAuth, requireApproval, async (req, res) => {
  try {
    const { sampleId } = req.params;

    const sample = await ActiveLearning.findById(sampleId);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && sample.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await ActiveLearning.findByIdAndDelete(sampleId);

    res.json({ message: 'Sample deleted successfully' });
  } catch (err) {
    console.error('Delete sample error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
