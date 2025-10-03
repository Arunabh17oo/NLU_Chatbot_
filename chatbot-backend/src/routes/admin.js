import express from 'express';
import { Dataset } from '../models/Dataset.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/roleAuth.js';

const router = express.Router();

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users with pagination and filters
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('approvedBy', 'username email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DATASET MANAGEMENT ====================

// GET /api/admin/datasets - Get all datasets
router.get('/datasets', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      ownerId, 
      isPublic, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (ownerId) query.ownerId = ownerId;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const datasets = await Dataset.find(query)
      .populate('ownerId', 'username email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dataset.countDocuments(query);

    res.json({
      datasets,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get datasets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/datasets/:datasetId - Get specific dataset
router.get('/datasets/:datasetId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { datasetId } = req.params;

    const dataset = await Dataset.findById(datasetId)
      .populate('ownerId', 'username email');

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    res.json({ dataset });
  } catch (err) {
    console.error('Get dataset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/datasets/:datasetId - Update dataset
router.put('/datasets/:datasetId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { name, description, isPublic, tags } = req.body;

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    if (name) dataset.name = name;
    if (description !== undefined) dataset.description = description;
    if (isPublic !== undefined) dataset.isPublic = isPublic;
    if (tags) dataset.tags = tags;
    dataset.lastModified = new Date();

    await dataset.save();

    res.json({
      message: 'Dataset updated successfully',
      dataset
    });
  } catch (err) {
    console.error('Update dataset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/datasets/:datasetId - Delete dataset
router.delete('/datasets/:datasetId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { datasetId } = req.params;

    const dataset = await Dataset.findByIdAndDelete(datasetId);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    res.json({ message: 'Dataset deleted successfully' });
  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PROJECT MANAGEMENT ====================

// GET /api/admin/projects - Get all projects
router.get('/projects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      ownerId, 
      status, 
      isPublic, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (ownerId) query.ownerId = ownerId;
    if (status) query.status = status;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const projects = await Project.find(query)
      .populate('ownerId', 'username email')
      .populate('collaborators.userId', 'username email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/projects/:projectId - Get specific project
router.get('/projects/:projectId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('ownerId', 'username email')
      .populate('collaborators.userId', 'username email')
      .populate('datasetIds', 'name description totalSamples');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/projects/:projectId - Update project
router.put('/projects/:projectId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, isPublic, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (isPublic !== undefined) project.isPublic = isPublic;
    if (tags) project.tags = tags;

    await project.save();

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/projects/:projectId - Delete project
router.delete('/projects/:projectId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DASHBOARD STATISTICS ====================

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      totalDatasets,
      totalProjects,
      recentUsers,
      recentDatasets,
      recentProjects
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isApproved: false }),
      Dataset.countDocuments(),
      Project.countDocuments(),
      User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(5),
      Dataset.find().populate('ownerId', 'username').sort({ createdAt: -1 }).limit(5),
      Project.find().populate('ownerId', 'username').sort({ createdAt: -1 }).limit(5)
    ]);

    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const projectStats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        pendingUsers,
        totalDatasets,
        totalProjects
      },
      recentActivity: {
        users: recentUsers,
        datasets: recentDatasets,
        projects: recentProjects
      },
      statistics: {
        userRoles: userStats,
        projectStatuses: projectStats
      }
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
