import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiGitBranch, 
  FiPlus, 
  FiDownload, 
  FiTrash2, 
  FiEdit3,
  FiBarChart2,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTag
} from 'react-icons/fi';
import './ModelVersioningDashboard.css';

export default function ModelVersioningDashboard({ selectedWorkspace, modelInfo }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    description: '',
    tags: []
  });
  const [statistics, setStatistics] = useState(null);
  const [serverModelId, setServerModelId] = useState(null);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchVersions();
      fetchStatistics();
      fetchServerModelId();
    }
  }, [selectedWorkspace]);

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/model-versioning/versions/${selectedWorkspace.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setVersions(response.data?.versions || []);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      setVersions([]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/model-versioning/statistics?workspaceId=${selectedWorkspace.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // If user refreshed after training, modelInfo prop may be null.
  // Try to fetch model info from backend to enable version creation.
  const fetchServerModelId = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/training/model-info/${selectedWorkspace.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const mid = response?.data?.model?.id;
      if (mid) setServerModelId(mid);
    } catch (error) {
      // Swallow: not trained yet, keep button disabled
    }
  };

  const createVersion = async () => {
    const modelIdToUse = modelInfo?.modelId || serverModelId;
    if (!selectedWorkspace || !modelIdToUse) {
      alert('Please select workspace and ensure model is trained');
      return;
    }

    setIsCreatingVersion(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/model-versioning/create',
        {
          workspaceId: selectedWorkspace.id,
          modelId: modelIdToUse,
          description: newVersionData.description || `Model version ${versions.length + 1}`,
          tags: newVersionData.tags.length > 0 ? newVersionData.tags : ['manual']
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchVersions();
      await fetchStatistics();
      setShowCreateForm(false);
      setNewVersionData({ description: '', tags: [] });
      alert('Model version created successfully!');
    } catch (error) {
      console.error('Create version error:', error);
      alert(error.response?.data?.message || 'Failed to create version');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const updateVersion = async (versionId, updates) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `http://localhost:3001/api/model-versioning/version/${versionId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchVersions();
      alert('Version updated successfully!');
    } catch (error) {
      console.error('Update version error:', error);
      alert('Failed to update version');
    }
  };

  const deleteVersion = async (versionId) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `http://localhost:3001/api/model-versioning/version/${versionId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      await fetchVersions();
      await fetchStatistics();
      alert('Version deleted successfully!');
    } catch (error) {
      console.error('Delete version error:', error);
      alert('Failed to delete version');
    }
  };

  const exportVersion = async (versionId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/model-versioning/export/${versionId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model_version_${versionId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  const compareVersions = async () => {
    if (selectedVersions.length < 2) {
      alert('Please select at least 2 versions to compare');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/model-versioning/compare',
        { versionIds: selectedVersions },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setComparisonResults(response.data.comparison);
    } catch (error) {
      console.error('Comparison error:', error);
      alert(error.response?.data?.message || 'Comparison failed');
    } finally {
      setIsComparing(false);
    }
  };

  const toggleVersionSelection = (versionId) => {
    setSelectedVersions(prev => 
      prev.includes(versionId)
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    return status === 'active' ? <FiCheckCircle className="status-active" /> : <FiXCircle className="status-inactive" />;
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#10b981' : '#6b7280';
  };

  // Safely read evaluation metrics regardless of backend shape
  const getEvalMetric = (evaluationResults, key) => {
    if (!evaluationResults) return null;
    if (evaluationResults.metrics && typeof evaluationResults.metrics[key] === 'number') {
      return evaluationResults.metrics[key];
    }
    if (typeof evaluationResults[key] === 'number') {
      return evaluationResults[key];
    }
    return null;
  };

  return (
    <div className="model-versioning-dashboard">
      <div className="dashboard-header">
        <h2><FiGitBranch /> Model Versioning Dashboard</h2>
        <p>Manage and compare different versions of your trained models</p>
      </div>

      {!selectedWorkspace ? (
        <div className="no-workspace">
          <FiXCircle size={48} />
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to access versioning features</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Statistics */}
          {statistics && (
              <div className="statistics-section">
              <h3><FiBarChart2 /> Version Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Versions</div>
                    <div className="stat-value">{Number(statistics?.totalVersions ?? 0)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Versions</div>
                    <div className="stat-value">{Number(statistics?.activeVersions ?? 0)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Inactive Versions</div>
                    <div className="stat-value">{Number(statistics?.inactiveVersions ?? 0)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Intents</div>
                    <div className="stat-value">{Number.isFinite(statistics?.averageIntents) ? statistics.averageIntents.toFixed(1) : '0.0'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Training Examples</div>
                    <div className="stat-value">{Number.isFinite(statistics?.averageTrainingExamples) ? statistics.averageTrainingExamples.toFixed(0) : '0'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Create Version Section */}
          <div className="create-version-section">
            <div className="section-header">
              <h3><FiPlus /> Create New Version</h3>
              <button
                className="create-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={!modelInfo && !serverModelId}
              >
                {showCreateForm ? 'Cancel' : 'Create Version'}
              </button>
            </div>

            {!modelInfo && !serverModelId && (
              <div className="no-model-warning">
                <FiXCircle />
                <span>Please train a model first before creating versions</span>
              </div>
            )}

            {showCreateForm && (modelInfo || serverModelId) && (
              <div className="create-form">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newVersionData.description}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter version description..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newVersionData.tags.join(', ')}
                    onChange={(e) => setNewVersionData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    placeholder="e.g., production, experimental, v1.0"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="submit-btn"
                    onClick={createVersion}
                    disabled={isCreatingVersion}
                  >
                    {isCreatingVersion ? <FiRefreshCw className="spinning" /> : <FiPlus />}
                    {isCreatingVersion ? 'Creating...' : 'Create Version'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Versions List */}
          <div className="versions-section">
            <div className="section-header">
              <h3><FiGitBranch /> Model Versions</h3>
              <div className="section-actions">
                {selectedVersions.length >= 2 && (
                  <button
                    className="compare-btn"
                    onClick={compareVersions}
                    disabled={isComparing}
                  >
                    {isComparing ? <FiRefreshCw className="spinning" /> : <FiBarChart2 />}
                    {isComparing ? 'Comparing...' : `Compare (${selectedVersions.length})`}
                  </button>
                )}
              </div>
            </div>

            {versions.length === 0 ? (
              <div className="no-versions">
                <FiGitBranch size={48} />
                <h4>No Versions Found</h4>
                <p>Create your first model version to get started</p>
              </div>
            ) : (
              <div className="versions-list">
                {versions.map((version, index) => (
                  <div key={version.id} className="version-item">
                    <div className="version-header">
                      <div className="version-info">
                        <div className="version-title">
                          <span className="version-number">v{version.versionNumber}</span>
                          <span className="version-status" style={{ color: getStatusColor(version.status) }}>
                            {getStatusIcon(version.status)}
                            {version.status}
                          </span>
                        </div>
                        <div className="version-meta">
                          <span className="version-date">
                            <FiClock />
                            {formatDate(version.createdAt)}
                          </span>
                          {version?.metadata?.tags && version.metadata.tags.length > 0 && (
                            <div className="version-tags">
                              {version.metadata.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="tag">
                                  <FiTag />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="version-actions">
                        <button
                          className="action-btn"
                          onClick={() => exportVersion(version.id)}
                          title="Export Version"
                        >
                          <FiDownload />
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={() => deleteVersion(version.id)}
                          title="Delete Version"
                        >
                          <FiTrash2 />
                        </button>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => toggleVersionSelection(version.id)}
                          />
                          Compare
                        </label>
                      </div>
                    </div>

                    <div className="version-details">
                      <div className="version-description">
                        <strong>Description:</strong> {version?.metadata?.description || '—'}
                      </div>
                      <div className="version-metrics">
                        <div className="metric">
                          <span className="metric-label">Intents:</span>
                          <span className="metric-value">{version.intents.length}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Training Examples:</span>
                          <span className="metric-value">{version.trainingExamples}</span>
                        </div>
                        {(() => {
                          const acc = getEvalMetric(version.evaluationResults, 'accuracy');
                          return acc != null ? (
                            <div className="metric">
                              <span className="metric-label">Accuracy:</span>
                              <span className="metric-value">{(acc * 100).toFixed(2)}%</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comparison Results */}
          {comparisonResults && (
            <div className="comparison-results">
              <h3><FiBarChart2 /> Version Comparison</h3>
              <div className="comparison-summary">
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="stat-label">Total Versions:</span>
                    <span className="stat-value">{comparisonResults.summary.totalVersions}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Active Versions:</span>
                    <span className="stat-value">{comparisonResults.summary.activeVersions}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Latest Version:</span>
                    <span className="stat-value">v{comparisonResults.summary.latestVersion.versionNumber}</span>
                  </div>
                </div>
              </div>

              {comparisonResults.performanceComparison && (
                <div className="performance-comparison">
                  <h4>Performance Comparison</h4>
                  <div className="best-performance">
                    <div className="best-metric">
                      <span className="best-label">Best Accuracy:</span>
                      <span className="best-value">
                        v{comparisonResults.performanceComparison.bestAccuracy.versionNumber} - 
                        {(comparisonResults.performanceComparison.bestAccuracy.evaluationResults.metrics.accuracy * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="best-metric">
                      <span className="best-label">Best F1 Score:</span>
                      <span className="best-value">
                        v{comparisonResults.performanceComparison.bestF1Score.versionNumber} - 
                        {(comparisonResults.performanceComparison.bestF1Score.evaluationResults.metrics.f1Score * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Intents</th>
                      <th>Training Examples</th>
                      <th>Created</th>
                      <th>Accuracy</th>
                      <th>F1 Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.versions.map((version) => (
                      <tr key={version.id}>
                        <td>v{version.versionNumber}</td>
                        <td>
                          <span className={`status-badge ${version.status}`}>
                            {version.status}
                          </span>
                        </td>
                        <td>{version.intents.length}</td>
                        <td>{version.trainingExamples}</td>
                        <td>{formatDate(version.createdAt)}</td>
                        <td>
                          {version.evaluationResults ? 
                            `${(version.evaluationResults.metrics.accuracy * 100).toFixed(2)}%` : 
                            'N/A'
                          }
                        </td>
                        <td>
                          {version.evaluationResults ? 
                            `${(version.evaluationResults.metrics.f1Score * 100).toFixed(2)}%` : 
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
