import React, { useState, useEffect } from 'react';
import './FeedbackDashboard.css';
import { 
  FaCommentAlt, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaArrowLeft,
  FaThumbsUp,
  FaThumbsDown,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

const FeedbackDashboard = ({ onBack, user }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [currentPage, searchTerm, filterStatus, filterType]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        feedbackType: filterType !== 'all' ? filterType : undefined
      });

      const response = await fetch(`http://localhost:3001/api/feedback/user?${params}`, {
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

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/feedback/stats', {
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
      console.error('Error fetching feedback stats:', error);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
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

  const renderStats = () => (
    <div className="feedback-stats">
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaCommentAlt />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Feedback</p>
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
          
          <div className="stat-card applied">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.applied}</h3>
              <p>Applied</p>
            </div>
          </div>
          
          <div className="stat-card rejected">
            <div className="stat-icon">
              <FaTimesCircle />
            </div>
            <div className="stat-info">
              <h3>{stats.rejected}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedbackList = () => (
    <div className="feedback-list">
      <div className="list-header">
        <h2>Your Feedback</h2>
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
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="correction">Correction</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading feedback...</div>
      ) : (
        <div className="feedback-items">
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
                </div>
                <button
                  className="view-btn"
                  onClick={() => handleViewFeedback(feedback)}
                >
                  <FaEye />
                  View Details
                </button>
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
                    <strong>Your Comment:</strong> {feedback.feedbackText}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {feedbacks.length === 0 && (
            <div className="empty-state">
              <FaCommentAlt className="empty-icon" />
              <h3>No feedback found</h3>
              <p>You haven't submitted any feedback yet.</p>
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
    showModal && selectedFeedback && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Feedback Details</h3>
            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="detail-section">
              <h4>Original Prediction</h4>
              <div className="detail-content">
                <p><strong>Text:</strong> "{selectedFeedback.originalText}"</p>
                <p><strong>Predicted Intent:</strong> {selectedFeedback.originalIntent}</p>
                <p><strong>Confidence:</strong> {(selectedFeedback.originalConfidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Your Correction</h4>
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
                <p><strong>Submitted:</strong> {formatDate(selectedFeedback.createdAt)}</p>
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
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="feedback-dashboard">
      <div className="feedback-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft />
          Back to Workspace
        </button>
        <h1>Feedback Dashboard</h1>
      </div>
      
      {renderStats()}
      {renderFeedbackList()}
      {renderModal()}
    </div>
  );
};

export default FeedbackDashboard;
