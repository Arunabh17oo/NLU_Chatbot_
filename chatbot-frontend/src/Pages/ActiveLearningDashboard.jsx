import React, { useState, useEffect } from 'react';
import './ActiveLearningDashboard.css';
import { 
  FaBrain, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaArrowLeft,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaQuestionCircle,
  FaLightbulb
} from 'react-icons/fa';

const ActiveLearningDashboard = ({ onBack, user }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterPriority, setFilterPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSample, setSelectedSample] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('uncertaintyScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState(new Set());
  const [annotationForm, setAnnotationForm] = useState({
    correctIntent: '',
    annotationNotes: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchSamples();
    fetchStats();
  }, [currentPage, searchTerm, filterStatus, filterPriority, sortBy, sortOrder]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        sortBy,
        sortOrder
      });

      const response = await fetch(`http://localhost:3001/api/active-learning/queue?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSamples(data.samples);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/active-learning/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching active learning stats:', error);
    }
  };

  const handleViewSample = (sample) => {
    setSelectedSample(sample);
    setAnnotationForm({
      correctIntent: sample.correctIntent || '',
      annotationNotes: sample.annotationNotes || '',
      priority: sample.priority || 'medium'
    });
    setShowModal(true);
  };

  const handleAnnotateSample = async (sampleId, formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/active-learning/${sampleId}/annotate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        fetchSamples();
        fetchStats();
      }
    } catch (error) {
      console.error('Error annotating sample:', error);
    }
  };

  const handleBatchAnnotate = async () => {
    if (selectedSamples.size === 0) return;

    const annotations = Array.from(selectedSamples).map(sampleId => ({
      sampleId,
      correctIntent: annotationForm.correctIntent,
      annotationNotes: annotationForm.annotationNotes,
      priority: annotationForm.priority
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/active-learning/batch-annotate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ annotations })
      });

      if (response.ok) {
        setSelectedSamples(new Set());
        setBatchMode(false);
        fetchSamples();
        fetchStats();
      }
    } catch (error) {
      console.error('Error batch annotating:', error);
    }
  };

  const handleDeleteSample = async (sampleId) => {
    if (window.confirm('Are you sure you want to delete this sample?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/active-learning/${sampleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchSamples();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting sample:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'reviewed':
        return <FaEye className="status-icon reviewed" />;
      case 'annotated':
        return <FaCheckCircle className="status-icon annotated" />;
      case 'retrained':
        return <FaCheck className="status-icon retrained" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <FaExclamationTriangle className="priority-icon urgent" />;
      case 'high':
        return <FaExclamationTriangle className="priority-icon high" />;
      case 'medium':
        return <FaQuestionCircle className="priority-icon medium" />;
      case 'low':
        return <FaLightbulb className="priority-icon low" />;
      default:
        return <FaQuestionCircle className="priority-icon" />;
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const renderStats = () => (
    <div className="active-learning-stats">
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBrain />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Samples</p>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending Review</p>
            </div>
          </div>
          
          <div className="stat-card annotated">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.annotated}</h3>
              <p>Annotated</p>
            </div>
          </div>
          
          <div className="stat-card retrained">
            <div className="stat-icon">
              <FaCheck />
            </div>
            <div className="stat-info">
              <h3>{stats.retrained}</h3>
              <p>Retrained</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSamplesList = () => (
    <div className="samples-list">
      <div className="list-header">
        <h2>Uncertain Samples Queue</h2>
        <div className="list-controls">
          <div className="search-filters">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search samples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="annotated">Annotated</option>
              <option value="retrained">Retrained</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="batch-controls">
            <button
              className={`batch-btn ${batchMode ? 'active' : ''}`}
              onClick={() => setBatchMode(!batchMode)}
            >
              <FaEdit />
              Batch Mode
            </button>
            {batchMode && selectedSamples.size > 0 && (
              <button
                className="batch-annotate-btn"
                onClick={handleBatchAnnotate}
              >
                Annotate Selected ({selectedSamples.size})
              </button>
            )}
          </div>
        </div>

      </div>

      {loading ? (
        <div className="loading">Loading samples...</div>
      ) : (
        <div className="samples-container">
          <div className="table-container">
            <table className="samples-table">
              <thead>
                <tr>
                  {batchMode && <th>Select</th>}
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('text')}
                    >
                      Text {getSortIcon('text')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('predictedIntent')}
                    >
                      Predicted Intent {getSortIcon('predictedIntent')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('confidence')}
                    >
                      Confidence {getSortIcon('confidence')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('uncertaintyScore')}
                    >
                      Uncertainty {getSortIcon('uncertaintyScore')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('priority')}
                    >
                      Priority {getSortIcon('priority')}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(sample => (
                  <tr key={sample._id} className={selectedSamples.has(sample._id) ? 'selected' : ''}>
                    {batchMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSamples.has(sample._id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedSamples);
                            if (e.target.checked) {
                              newSelected.add(sample._id);
                            } else {
                              newSelected.delete(sample._id);
                            }
                            setSelectedSamples(newSelected);
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <div className="sample-text">
                        {sample.text.length > 50 
                          ? `${sample.text.substring(0, 50)}...` 
                          : sample.text
                        }
                      </div>
                    </td>
                    <td>
                      <span className="intent-badge predicted">
                        {sample.predictedIntent}
                      </span>
                    </td>
                    <td>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill"
                          style={{ width: `${sample.confidence * 100}%` }}
                        />
                        <span className="confidence-text">
                          {(sample.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="uncertainty-bar">
                        <div 
                          className="uncertainty-fill"
                          style={{ width: `${sample.uncertaintyScore * 100}%` }}
                        />
                        <span className="uncertainty-text">
                          {(sample.uncertaintyScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="priority-cell">
                        {getPriorityIcon(sample.priority)}
                        <span className="priority-text">{sample.priority}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        {getStatusIcon(sample.status)}
                        <span className="status-text">{sample.status}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => handleViewSample(sample)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => handleViewSample(sample)}
                          title="Annotate"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteSample(sample._id)}
                          title="Delete"
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
          
          {samples.length === 0 && (
            <div className="empty-state">
              <FaBrain className="empty-icon" />
              <h3>No uncertain samples found</h3>
              <p>All samples have been reviewed or there are no uncertain predictions.</p>
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

  const renderModal = () => (
    showModal && selectedSample && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Annotate Sample</h3>
            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="sample-details">
              <h4>Original Sample</h4>
              <div className="sample-content">
                <p><strong>Text:</strong> "{selectedSample.text}"</p>
                <p><strong>Predicted Intent:</strong> {selectedSample.predictedIntent}</p>
                <p><strong>Confidence:</strong> {(selectedSample.confidence * 100).toFixed(1)}%</p>
                <p><strong>Uncertainty Score:</strong> {(selectedSample.uncertaintyScore * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="annotation-form">
              <h4>Annotation</h4>
              <div className="form-group">
                <label>Correct Intent:</label>
                <input
                  type="text"
                  value={annotationForm.correctIntent}
                  onChange={(e) => setAnnotationForm(prev => ({
                    ...prev,
                    correctIntent: e.target.value
                  }))}
                  placeholder="Enter the correct intent"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={annotationForm.priority}
                  onChange={(e) => setAnnotationForm(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                  value={annotationForm.annotationNotes}
                  onChange={(e) => setAnnotationForm(prev => ({
                    ...prev,
                    annotationNotes: e.target.value
                  }))}
                  placeholder="Add any additional notes about this annotation"
                  rows="3"
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              className="submit-btn"
              onClick={() => handleAnnotateSample(selectedSample._id, annotationForm)}
              disabled={!annotationForm.correctIntent}
            >
              <FaCheck />
              Submit Annotation
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="active-learning-dashboard">
      <div className="dashboard-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft />
          Back to Workspace
        </button>
        <h1>Active Learning Dashboard</h1>
      </div>
      
      {renderStats()}
      {renderSamplesList()}
      {renderModal()}
    </div>
  );
};

export default ActiveLearningDashboard;

