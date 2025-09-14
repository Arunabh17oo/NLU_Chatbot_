import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBarChart2, 
  FiUpload, 
  FiDownload, 
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTarget,
  FiTrendingUp,
  FiActivity,
  FiEye,
  FiFileText
} from 'react-icons/fi';
import './EvaluationDashboard.css';

export default function EvaluationDashboard({ selectedWorkspace, modelInfo }) {
  const [testFile, setTestFile] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [holdoutRatio, setHoldoutRatio] = useState(0.2);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchEvaluationHistory();
    }
  }, [selectedWorkspace]);

  const fetchEvaluationHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/evaluation/workspace/${selectedWorkspace.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setEvaluationHistory(response.data.evaluations);
    } catch (error) {
      console.error('Failed to fetch evaluation history:', error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
    }
  };

  const evaluateModel = async () => {
    if (!selectedWorkspace || !modelInfo) {
      alert('Please select workspace and ensure model is trained');
      return;
    }

    if (!testFile) {
      alert('Please upload test data file first');
      return;
    }

    setIsEvaluating(true);
    setCurrentResults(null);

    try {
      const formData = new FormData();
      formData.append('testData', testFile);
      formData.append('workspaceId', selectedWorkspace.id);
      formData.append('modelId', modelInfo.modelId);
      formData.append('description', `Evaluation on ${testFile.name}`);

      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/evaluation/evaluate',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setCurrentResults(response.data.evaluation);
      await fetchEvaluationHistory();
      setTestFile(null);
      alert('Model evaluation completed successfully!');
    } catch (error) {
      console.error('Evaluation error:', error);
      alert(error.response?.data?.message || 'Evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluateHoldout = async () => {
    if (!selectedWorkspace || !modelInfo) {
      alert('Please select workspace and ensure model is trained');
      return;
    }

    setIsEvaluating(true);
    setCurrentResults(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/evaluation/evaluate-holdout',
        {
          workspaceId: selectedWorkspace.id,
          modelId: modelInfo.modelId,
          holdoutRatio
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCurrentResults(response.data.evaluation);
      await fetchEvaluationHistory();
      alert('Holdout evaluation completed successfully!');
    } catch (error) {
      console.error('Holdout evaluation error:', error);
      alert(error.response?.data?.message || 'Holdout evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const exportEvaluation = async (evaluationId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:3001/api/evaluation/export/${evaluationId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation_${evaluationId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  const compareEvaluations = async () => {
    if (selectedEvaluations.length < 2) {
      alert('Please select at least 2 evaluations to compare');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:3001/api/evaluation/compare',
        { evaluationIds: selectedEvaluations },
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

  const toggleEvaluationSelection = (evaluationId) => {
    setSelectedEvaluations(prev => 
      prev.includes(evaluationId)
        ? prev.filter(id => id !== evaluationId)
        : [...prev, evaluationId]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const renderConfusionMatrix = (confusionMatrix) => {
    if (!confusionMatrix || !confusionMatrix.matrix) return null;

    const { labels, matrix } = confusionMatrix;

    return (
      <div className="confusion-matrix">
        <h4><FiTarget /> Confusion Matrix</h4>
        <div className="matrix-container">
          <table className="confusion-table">
            <thead>
              <tr>
                <th>True \ Predicted</th>
                {labels.map(label => (
                  <th key={label} title={label}>
                    {label.length > 12 ? label.substring(0, 12) + '...' : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map(trueLabel => (
                <tr key={trueLabel}>
                  <th title={trueLabel}>
                    {trueLabel.length > 12 ? trueLabel.substring(0, 12) + '...' : trueLabel}
                  </th>
                  {labels.map(predLabel => (
                    <td key={predLabel} style={{
                      backgroundColor: matrix[trueLabel][predLabel] > 0 ? 
                        `rgba(59, 130, 246, ${Math.min(matrix[trueLabel][predLabel] / 10, 0.8)})` : 
                        'white'
                    }}>
                      {matrix[trueLabel][predLabel]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="evaluation-dashboard">
      <div className="dashboard-header">
        <h2><FiBarChart2 /> Model Evaluation Dashboard</h2>
        <p>Evaluate your trained models with comprehensive metrics and visualizations</p>
      </div>

      {!selectedWorkspace ? (
        <div className="no-workspace">
          <FiXCircle size={48} />
          <h3>No Workspace Selected</h3>
          <p>Please select a workspace to access evaluation features</p>
        </div>
      ) : !modelInfo ? (
        <div className="no-model">
          <FiXCircle size={48} />
          <h3>No Model Trained</h3>
          <p>Please train a model first before running evaluations</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Evaluation Section */}
          <div className="evaluation-section">
            <h3><FiActivity /> Model Evaluation</h3>
            <div className="evaluation-controls">
              <div className="file-upload">
                <label className="upload-label">
                  <FiUpload />
                  <span>Upload Test Data (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                </label>
                {testFile && (
                  <div className="file-info">
                    Selected: {testFile.name} ({(testFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="evaluation-buttons">
                <button
                  className="eval-btn primary"
                  onClick={evaluateModel}
                  disabled={isEvaluating || !testFile}
                >
                  {isEvaluating ? <FiRefreshCw className="spinning" /> : <FiBarChart2 />}
                  {isEvaluating ? 'Evaluating...' : 'Evaluate Model'}
                </button>
                <button
                  className="eval-btn secondary"
                  onClick={evaluateHoldout}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? <FiRefreshCw className="spinning" /> : <FiTrendingUp />}
                  {isEvaluating ? 'Evaluating...' : 'Holdout Evaluation'}
                </button>
              </div>

              <div className="holdout-controls">
                <label>
                  Holdout Ratio: 
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={holdoutRatio}
                    onChange={(e) => setHoldoutRatio(parseFloat(e.target.value))}
                  />
                  {formatPercentage(holdoutRatio)}
                </label>
              </div>
            </div>
          </div>

          {/* Current Results */}
          {currentResults && (
            <div className="current-results">
              <h3><FiCheckCircle /> Latest Evaluation Results</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Accuracy</div>
                  <div className="metric-value">{formatPercentage(currentResults.metrics.accuracy)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">F1 Score</div>
                  <div className="metric-value">{formatPercentage(currentResults.metrics.f1Score)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Precision</div>
                  <div className="metric-value">{formatPercentage(currentResults.metrics.macroPrecision)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Recall</div>
                  <div className="metric-value">{formatPercentage(currentResults.metrics.macroRecall)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Test Samples</div>
                  <div className="metric-value">{currentResults.testDataSize}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Correct Predictions</div>
                  <div className="metric-value">{currentResults.metrics.correctPredictions}</div>
                </div>
              </div>

              {renderConfusionMatrix(currentResults.confusionMatrix)}
            </div>
          )}

          {/* Evaluation History */}
          <div className="evaluation-history">
            <h3><FiClock /> Evaluation History</h3>
            
            {evaluationHistory.length === 0 ? (
              <div className="no-evaluations">
                <FiBarChart2 size={48} />
                <h4>No Evaluations Yet</h4>
                <p>Run your first evaluation to see results here</p>
              </div>
            ) : (
              <>
                <div className="evaluations-list">
                  {evaluationHistory.map((evaluation) => (
                    <div key={evaluation.id} className="evaluation-item">
                      <div className="evaluation-header">
                        <div className="evaluation-info">
                          <h4>Evaluation {evaluation.id.split('_').pop()}</h4>
                          <div className="evaluation-date">
                            <FiClock />
                            {formatDate(evaluation.timestamp)}
                          </div>
                        </div>
                        <div className="evaluation-actions">
                          <button
                            className="action-btn"
                            onClick={() => exportEvaluation(evaluation.id)}
                            title="Export Results"
                          >
                            <FiDownload />
                          </button>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedEvaluations.includes(evaluation.id)}
                              onChange={() => toggleEvaluationSelection(evaluation.id)}
                            />
                            Compare
                          </label>
                        </div>
                      </div>
                      <div className="evaluation-metrics">
                        <div className="metric">
                          <span className="metric-name">Accuracy:</span>
                          <span className="metric-value">{formatPercentage(evaluation.metrics.accuracy)}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-name">F1 Score:</span>
                          <span className="metric-value">{formatPercentage(evaluation.metrics.f1Score)}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-name">Test Samples:</span>
                          <span className="metric-value">{evaluation.testDataSize}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedEvaluations.length >= 2 && (
                  <div className="comparison-section">
                    <div className="comparison-header">
                      <h4><FiEye /> Evaluation Comparison</h4>
                      <button
                        className="compare-btn"
                        onClick={compareEvaluations}
                        disabled={isComparing}
                      >
                        {isComparing ? <FiRefreshCw className="spinning" /> : <FiBarChart2 />}
                        {isComparing ? 'Comparing...' : `Compare (${selectedEvaluations.length})`}
                      </button>
                    </div>

                    {comparisonResults && (
                      <div className="comparison-results">
                        <h4>Comparison Summary</h4>
                        <div className="comparison-summary">
                          <div className="best-metrics">
                            <div className="best-metric">
                              <span className="best-label">Best Accuracy:</span>
                              <span className="best-value">
                                {formatPercentage(comparisonResults.bestAccuracy.metrics.accuracy)} 
                                (Model: {comparisonResults.bestAccuracy.modelId})
                              </span>
                            </div>
                            <div className="best-metric">
                              <span className="best-label">Best F1 Score:</span>
                              <span className="best-value">
                                {formatPercentage(comparisonResults.bestF1Score.metrics.f1Score)} 
                                (Model: {comparisonResults.bestF1Score.modelId})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="comparison-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Model ID</th>
                                <th>Accuracy</th>
                                <th>F1 Score</th>
                                <th>Test Samples</th>
                                <th>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comparisonResults.evaluations.map((evaluation) => (
                                <tr key={evaluation.id}>
                                  <td>{evaluation.modelId}</td>
                                  <td>{formatPercentage(evaluation.metrics.accuracy)}</td>
                                  <td>{formatPercentage(evaluation.metrics.f1Score)}</td>
                                  <td>{evaluation.testDataSize}</td>
                                  <td>{formatDate(evaluation.timestamp)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
