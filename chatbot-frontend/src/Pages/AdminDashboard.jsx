import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { 
  FaUsers, 
  FaDatabase, 
  FaProjectDiagram, 
  FaChartBar, 
  FaUserCheck, 
  FaUserTimes, 
  FaCog,
  FaSignOutAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaCommentAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaThumbsUp,
  FaThumbsDown,
  FaExclamationTriangle
} from 'react-icons/fa';

const AdminDashboard = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [showDatasetEditModal, setShowDatasetEditModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'datasets') {
      fetchDatasets();
    } else if (activeTab === 'projects') {
      fetchProjects();
    } else if (activeTab === 'feedback') {
      fetchFeedbacks();
    }
  }, [activeTab, currentPage, searchTerm, filterStatus]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filterStatus
      });

      const response = await fetch(`http://localhost:3001/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`http://localhost:3001/api/admin/datasets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`http://localhost:3001/api/admin/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/auth/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      if (response.ok) {
        fetchUsers(); // Refresh users list
        fetchDashboardStats(); // Refresh dashboard stats
      }
    } catch (error) {
      console.error('Error updating user approval:', error);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        fetchUsers(); // Refresh users list
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/auth/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchUsers(); // Refresh users list
          fetchDashboardStats(); // Refresh dashboard stats
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteDataset = async (datasetId) => {
    if (window.confirm('Are you sure you want to delete this dataset?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/admin/datasets/${datasetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchDatasets(); // Refresh datasets list
          fetchDashboardStats(); // Refresh dashboard stats
        }
      } catch (error) {
        console.error('Error deleting dataset:', error);
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/admin/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchProjects(); // Refresh projects list
          fetchDashboardStats(); // Refresh dashboard stats
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleViewProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProject(data.project);
        setShowProjectModal(true);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (projectId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        fetchProjects(); // Refresh projects list
        setShowEditModal(false);
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleViewDataset = async (datasetId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/datasets/${datasetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDataset(data.dataset);
        setShowDatasetModal(true);
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
    }
  };

  const handleEditDataset = (dataset) => {
    setEditingDataset(dataset);
    setShowDatasetEditModal(true);
  };

  const handleUpdateDataset = async (datasetId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/datasets/${datasetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        fetchDatasets(); // Refresh datasets list
        setShowDatasetEditModal(false);
        setEditingDataset(null);
      }
    } catch (error) {
      console.error('Error updating dataset:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: filterStatus
      });

      const response = await fetch(`http://localhost:3001/api/feedback/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleReviewFeedback = async (feedbackId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/feedback/${feedbackId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchFeedbacks(); // Refresh feedbacks list
        setShowFeedbackModal(false);
        setSelectedFeedback(null);
      }
    } catch (error) {
      console.error('Error reviewing feedback:', error);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'reviewed':
        return <FaEye className="status-icon reviewed" />;
      case 'applied':
        return <FaCheckCircle className="status-icon applied" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'correction':
        return <FaExclamationTriangle className="type-icon correction" />;
      case 'suggestion':
        return <FaThumbsUp className="type-icon suggestion" />;
      case 'complaint':
        return <FaThumbsDown className="type-icon complaint" />;
      default:
        return <FaCommentAlt className="type-icon" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <h2>Admin Dashboard</h2>
      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : dashboardStats ? (
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{dashboardStats.overview.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <FaUserTimes />
            </div>
            <div className="stat-info">
              <h3>{dashboardStats.overview.pendingUsers}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaDatabase />
            </div>
            <div className="stat-info">
              <h3>{dashboardStats.overview.totalDatasets}</h3>
              <p>Total Datasets</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaProjectDiagram />
            </div>
            <div className="stat-info">
              <h3>{dashboardStats.overview.totalProjects}</h3>
              <p>Total Projects</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="error">Failed to load dashboard data</div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="content-header">
        <h2>User Management</h2>
        <div className="search-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {user.isActive ? (
                        <span className="status-badge active">Active</span>
                      ) : (
                        <span className="status-badge inactive">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {!user.isApproved && (
                        <button
                          className="btn-approve"
                          onClick={() => handleUserApproval(user._id, true)}
                          title="Approve User"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {user.isApproved && (
                        <button
                          className="btn-reject"
                          onClick={() => handleUserApproval(user._id, false)}
                          title="Reject User"
                        >
                          <FaTimes />
                        </button>
                      )}
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Delete User"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDatasets = () => (
    <div className="datasets-content">
      <div className="content-header">
        <h2>Dataset Management</h2>
        <div className="search-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading datasets...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Samples</th>
                <th>Intents</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map(dataset => (
                <tr key={dataset._id}>
                  <td>
                    <div className="dataset-info">
                      <h4>{dataset.name}</h4>
                      <p>{dataset.description}</p>
                    </div>
                  </td>
                  <td>{dataset.ownerId?.username || 'Unknown'}</td>
                  <td>{dataset.totalSamples}</td>
                  <td>{dataset.uniqueIntents?.length || 0}</td>
                  <td>
                    <span className={`status-badge ${dataset.isActive ? 'active' : 'inactive'}`}>
                      {dataset.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(dataset.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view" 
                        title="View Dataset"
                        onClick={() => handleViewDataset(dataset._id)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-edit" 
                        title="Edit Dataset"
                        onClick={() => handleEditDataset(dataset)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-delete" 
                        title="Delete Dataset"
                        onClick={() => handleDeleteDataset(dataset._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="projects-content">
      <div className="content-header">
        <h2>Project Management</h2>
        <div className="search-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Model Version</th>
                <th>Performance</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project._id}>
                  <td>
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      <p>{project.description}</p>
                    </div>
                  </td>
                  <td>{project.ownerId?.username || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${project.status}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>{project.currentModelVersion}</td>
                  <td>
                    {project.performance?.accuracy ? (
                      <span className="performance-badge">
                        {(project.performance.accuracy * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="performance-badge no-data">N/A</span>
                    )}
                  </td>
                  <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view" 
                        title="View Project"
                        onClick={() => handleViewProject(project._id)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-edit" 
                        title="Edit Project"
                        onClick={() => handleEditProject(project)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-delete" 
                        title="Delete Project"
                        onClick={() => handleDeleteProject(project._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  const renderFeedback = () => (
    <div className="feedback-content">
      <div className="content-header">
        <h2>Review Feedback</h2>
        <div className="search-filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="pending">Pending</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading feedback...</div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map(feedback => (
            <div key={feedback._id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-meta">
                  <div className="feedback-type">
                    {getTypeIcon(feedback.feedbackType)}
                    <span className="type-text">{feedback.feedbackType}</span>
                  </div>
                  <div className="feedback-status">
                    {getStatusIcon(feedback.status)}
                    <span className="status-text">{feedback.status}</span>
                  </div>
                  <div className="feedback-date">
                    {formatDate(feedback.createdAt)}
                  </div>
                  <div className="feedback-user">
                    <strong>User:</strong> {feedback.userId?.username || 'Unknown'}
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-view"
                    onClick={() => handleViewFeedback(feedback)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  {feedback.status === 'pending' && (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => handleReviewFeedback(feedback._id, 'applied')}
                        title="Accept Feedback"
                      >
                        <FaCheck />
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReviewFeedback(feedback._id, 'rejected')}
                        title="Reject Feedback"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="feedback-content">
                <div className="original-text">
                  <strong>Original Text:</strong> "{feedback.originalText}"
                </div>
                <div className="intent-comparison">
                  <div className="original-intent">
                    <span className="label">Original Intent:</span>
                    <span className="intent-badge original">
                      {feedback.originalIntent}
                    </span>
                    <span className="confidence">
                      ({(feedback.originalConfidence * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="corrected-intent">
                    <span className="label">Corrected Intent:</span>
                    <span className="intent-badge corrected">
                      {feedback.correctedIntent}
                    </span>
                  </div>
                </div>
                {feedback.feedbackText && (
                  <div className="feedback-text">
                    <strong>User Comment:</strong> {feedback.feedbackText}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {feedbacks.length === 0 && (
            <div className="empty-state">
              <FaCommentAlt className="empty-icon" />
              <h3>No feedback found</h3>
              <p>No feedback matches your current filters.</p>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <div className="admin-user">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span>{user?.username}</span>
          </div>
        </div>
        
        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartBar />
            Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers />
            Users
          </button>
          <button
            className={`nav-item ${activeTab === 'datasets' ? 'active' : ''}`}
            onClick={() => setActiveTab('datasets')}
          >
            <FaDatabase />
            Datasets
          </button>
          <button
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FaProjectDiagram />
            Projects
          </button>
          <button
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <FaCommentAlt />
            Review Feedback
          </button>
        </nav>
        
        <div className="admin-footer">
          <button className="logout-btn" onClick={onLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'datasets' && renderDatasets()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'feedback' && renderFeedback()}
      </div>

      {/* Project View Modal */}
      {showProjectModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Project Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowProjectModal(false);
                  setSelectedProject(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-details">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedProject.name}</span>
                </div>
                <div className="detail-row">
                  <label>Description:</label>
                  <span>{selectedProject.description || 'No description'}</span>
                </div>
                <div className="detail-row">
                  <label>Owner:</label>
                  <span>{selectedProject.ownerId?.username || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status-badge ${selectedProject.status}`}>
                    {selectedProject.status}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Model Version:</label>
                  <span>{selectedProject.currentModelVersion || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Performance:</label>
                  <span>
                    {selectedProject.performance?.accuracy ? 
                      `${(selectedProject.performance.accuracy * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <label>Created:</label>
                  <span>{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <label>Last Modified:</label>
                  <span>{new Date(selectedProject.updatedAt).toLocaleDateString()}</span>
                </div>
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="detail-row">
                    <label>Tags:</label>
                    <div className="tags">
                      {selectedProject.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {showEditModal && editingProject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Project</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  status: formData.get('status'),
                  isPublic: formData.get('isPublic') === 'true',
                  tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
                };
                handleUpdateProject(editingProject._id, updatedData);
              }}>
                <div className="form-group">
                  <label htmlFor="name">Project Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={editingProject.name}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={editingProject.description || ''}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingProject.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="training">Training</option>
                    <option value="completed">Completed</option>
                    <option value="deployed">Deployed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="isPublic">Public:</label>
                  <select
                    id="isPublic"
                    name="isPublic"
                    defaultValue={editingProject.isPublic ? 'true' : 'false'}
                  >
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated):</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    defaultValue={editingProject.tags ? editingProject.tags.join(', ') : ''}
                    placeholder="e.g., nlp, chatbot, ai"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit">Update Project</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dataset View Modal */}
      {showDatasetModal && selectedDataset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Dataset Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDatasetModal(false);
                  setSelectedDataset(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-details">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedDataset.name}</span>
                </div>
                <div className="detail-row">
                  <label>Description:</label>
                  <span>{selectedDataset.description || 'No description'}</span>
                </div>
                <div className="detail-row">
                  <label>Owner:</label>
                  <span>{selectedDataset.ownerId?.username || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status-badge ${selectedDataset.isActive ? 'active' : 'inactive'}`}>
                    {selectedDataset.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Total Samples:</label>
                  <span>{selectedDataset.totalSamples || 0}</span>
                </div>
                <div className="detail-row">
                  <label>Unique Intents:</label>
                  <span>{selectedDataset.uniqueIntents?.length || 0}</span>
                </div>
                <div className="detail-row">
                  <label>Public:</label>
                  <span>{selectedDataset.isPublic ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-row">
                  <label>Created:</label>
                  <span>{new Date(selectedDataset.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <label>Last Modified:</label>
                  <span>{new Date(selectedDataset.lastModified).toLocaleDateString()}</span>
                </div>
                {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                  <div className="detail-row">
                    <label>Tags:</label>
                    <div className="tags">
                      {selectedDataset.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Edit Modal */}
      {showDatasetEditModal && editingDataset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Dataset</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDatasetEditModal(false);
                  setEditingDataset(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  isPublic: formData.get('isPublic') === 'true',
                  tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
                };
                handleUpdateDataset(editingDataset._id, updatedData);
              }}>
                <div className="form-group">
                  <label htmlFor="name">Dataset Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={editingDataset.name}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={editingDataset.description || ''}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="isPublic">Public:</label>
                  <select
                    id="isPublic"
                    name="isPublic"
                    defaultValue={editingDataset.isPublic ? 'true' : 'false'}
                  >
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated):</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    defaultValue={editingDataset.tags ? editingDataset.tags.join(', ') : ''}
                    placeholder="e.g., nlp, chatbot, ai"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowDatasetEditModal(false);
                    setEditingDataset(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit">Update Dataset</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Feedback View Modal */}
      {showFeedbackModal && selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Feedback Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedFeedback(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>User Information</h4>
                <div className="detail-content">
                  <p><strong>User:</strong> {selectedFeedback.userId?.username || 'Unknown'}</p>
                  <p><strong>Email:</strong> {selectedFeedback.userId?.email || 'N/A'}</p>
                  <p><strong>Submitted:</strong> {formatDate(selectedFeedback.createdAt)}</p>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Original Prediction</h4>
                <div className="detail-content">
                  <p><strong>Text:</strong> "{selectedFeedback.originalText}"</p>
                  <p><strong>Predicted Intent:</strong> {selectedFeedback.originalIntent}</p>
                  <p><strong>Confidence:</strong> {(selectedFeedback.originalConfidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>User Correction</h4>
                <div className="detail-content">
                  <p><strong>Corrected Intent:</strong> {selectedFeedback.correctedIntent}</p>
                  <p><strong>Feedback Type:</strong> {selectedFeedback.feedbackType}</p>
                  {selectedFeedback.feedbackText && (
                    <p><strong>Additional Comments:</strong> {selectedFeedback.feedbackText}</p>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Status Information</h4>
                <div className="detail-content">
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${selectedFeedback.status}`}>
                      {selectedFeedback.status}
                    </span>
                  </p>
                  {selectedFeedback.reviewedAt && (
                    <p><strong>Reviewed:</strong> {formatDate(selectedFeedback.reviewedAt)}</p>
                  )}
                  {selectedFeedback.reviewedBy && (
                    <p><strong>Reviewed By:</strong> {selectedFeedback.reviewedBy.username}</p>
                  )}
                  {selectedFeedback.isRetrained && (
                    <p><strong>Retrained:</strong> {formatDate(selectedFeedback.retrainedAt)}</p>
                  )}
                </div>
              </div>

              {selectedFeedback.status === 'pending' && (
                <div className="modal-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleReviewFeedback(selectedFeedback._id, 'applied')}
                  >
                    <FaCheck />
                    Accept Feedback
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReviewFeedback(selectedFeedback._id, 'rejected')}
                  >
                    <FaTimes />
                    Reject Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
