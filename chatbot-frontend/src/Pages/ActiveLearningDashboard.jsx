import React, { useState, useEffect } from 'react';
import './ActiveLearningDashboard.css';
import { 
  FaArrowLeft,
  FaBrain,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaLightbulb,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaSync,
  FaCog
} from 'react-icons/fa';

const ActiveLearningDashboard = ({ onBack, user }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSample, setSelectedSample] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [retrainingSample, setRetrainingSample] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    fetchUncertaintySamples();
  }, [currentPage, sortBy, sortOrder]);

  const fetchUncertaintySamples = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder
      });

      const response = await fetch(`http://localhost:3001/api/active-learning/uncertainty-history?${params}`, {
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
      console.error('Error fetching uncertainty samples:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'reviewed':
        return <FaEye className="status-icon reviewed" />;
      case 'annotated':
        return <FaCheckCircle className="status-icon annotated" />;
      case 'retrained':
        return <FaCheckCircle className="status-icon retrained" />;
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

  const handleViewSample = (sample) => {
    setSelectedSample(sample);
    setShowModal(true);
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
          fetchUncertaintySamples();
        }
      } catch (error) {
        console.error('Error deleting sample:', error);
      }
    }
  };

  const fetchIntentSuggestions = async (text, workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/feedback/suggestions/${encodeURIComponent(text)}?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        console.error('Failed to fetch suggestions');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching intent suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleRetrainModel = async (sample) => {
    setRetrainingSample(sample);
    setSelectedWorkspace(sample.workspaceId);
    await fetchIntentSuggestions(sample.text, sample.workspaceId);
  };

  const executeRetrain = async (correctIntent) => {
    if (!retrainingSample || !selectedWorkspace) return;

    try {
      const token = localStorage.getItem('token');
      const workspaceId = typeof selectedWorkspace === 'string' ? selectedWorkspace : selectedWorkspace.id;
      
      console.log('Retraining with:', {
        sampleId: retrainingSample._id,
        correctIntent,
        workspaceId,
        selectedWorkspace
      });

      const response = await fetch(`http://localhost:3001/api/active-learning/${retrainingSample._id}/retrain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correctIntent: correctIntent,
          workspaceId: workspaceId
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Model retrained successfully! ${data.message}`);
        fetchUncertaintySamples(); // Refresh the list
        setShowSuggestions(false);
        setRetrainingSample(null);
        setSuggestions([]);
      } else {
        const errorData = await response.json();
        console.error('Retraining API error:', errorData);
        alert(`Retraining failed: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error retraining model:', error);
      alert(`Failed to retrain model: ${error.message || 'Please try again.'}`);
    }
  };

  const renderUncertaintyHistory = () => (
    <div className="uncertainty-samples-history">
      <div className="history-header">
        <h2>Uncertainty Samples History</h2>
        <p>All uncertain predictions with uncertainty &gt; 80% collected for review</p>
      </div>

      {loading ? (
        <div className="loading">Loading uncertainty samples...</div>
      ) : (
        <div className="samples-container">
          {samples.length === 0 ? (
            <div className="empty-state">
              <FaBrain className="empty-icon" />
              <h3>No uncertain samples found</h3>
              <p>No uncertain predictions have been collected yet.</p>
            </div>
          ) : (
            <div className="samples-list">
              <div className="table-container">
                <table className="samples-table">
                  <thead>
                    <tr>
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
                      <th>
                        <button
                          className="sort-btn"
                          onClick={() => handleSort('createdAt')}
                        >
                          Date {getSortIcon('createdAt')}
                        </button>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map(sample => (
                      <tr key={sample._id}>
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
                          <div className="date-cell">
                            {formatDate(sample.createdAt)}
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
                              className="retrain-btn"
                              onClick={() => handleRetrainModel(sample)}
                              title="Re-train Model"
                              disabled={sample.status === 'retrained'}
                            >
                              <FaSync />
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
      )}
    </div>
  );

  const renderModal = () => (
    showModal && selectedSample && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Sample Details</h3>
            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              ×
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
                <p><strong>Priority:</strong> {selectedSample.priority}</p>
                <p><strong>Status:</strong> {selectedSample.status}</p>
                <p><strong>Created:</strong> {formatDate(selectedSample.createdAt)}</p>
                {selectedSample.correctIntent && (
                  <p><strong>Corrected Intent:</strong> {selectedSample.correctIntent}</p>
                )}
                {selectedSample.annotationNotes && (
                  <p><strong>Notes:</strong> {selectedSample.annotationNotes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderSuggestionsModal = () => (
    showSuggestions && retrainingSample && (
      <div className="modal-overlay" onClick={() => setShowSuggestions(false)}>
        <div className="modal-content suggestions-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Re-train Model</h3>
            <button
              className="close-btn"
              onClick={() => setShowSuggestions(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="retrain-section">
              <h4>Sample to Retrain:</h4>
              <div className="sample-info">
                <p><strong>Text:</strong> "{retrainingSample.text}"</p>
                <p><strong>Current Prediction:</strong> {retrainingSample.predictedIntent}</p>
                <p><strong>Uncertainty:</strong> {(retrainingSample.uncertaintyScore * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="suggestions-section">
              <h4>Correct Intent Suggestions from Feedback:</h4>
              {suggestions.length > 0 ? (
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <div className="suggestion-header">
                        <span className="intent-name">{suggestion.intent}</span>
                        <span className="confidence-badge">
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </span>
                        <span className="count-badge">
                          {suggestion.count} feedback{suggestion.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="suggestion-examples">
                        <strong>Examples:</strong>
                        {suggestion.examples.slice(0, 3).map((example, idx) => (
                          <div key={idx} className="example-item">
                            "{example.text}" - {example.correctedBy} ({formatDate(example.correctedAt)})
                          </div>
                        ))}
                      </div>
                      <button
                        className="select-intent-btn"
                        onClick={() => executeRetrain(suggestion.intent)}
                      >
                        <FaCog /> Use This Intent
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-suggestions">
                  <p>No feedback suggestions found for this text.</p>
                  <p>You can manually enter the correct intent:</p>
                  <div className="manual-input">
                    <input
                      type="text"
                      placeholder="Enter correct intent..."
                      id="manualIntent"
                      className="intent-input"
                    />
                    <button
                      className="manual-retrain-btn"
                      onClick={() => {
                        const manualIntent = document.getElementById('manualIntent').value;
                        if (manualIntent.trim()) {
                          executeRetrain(manualIntent.trim());
                        } else {
                          alert('Please enter a correct intent');
                        }
                      }}
                    >
                      <FaSync /> Retrain with Manual Intent
                    </button>
                  </div>
                </div>
              )}
            </div>
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
      
      {renderUncertaintyHistory()}
      {renderModal()}
      {renderSuggestionsModal()}
    </div>
  );
};

export default ActiveLearningDashboard;