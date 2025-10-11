import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './Workspace.css'
import { FiPlus, FiFolder, FiUpload, FiCpu, FiCheck, FiBarChart2, FiGitBranch, FiMessageCircle, FiZap, FiSettings } from 'react-icons/fi'
import EvaluationDashboard from './EvaluationDashboard'
import ModelVersioningDashboard from './ModelVersioningDashboard'

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const parts = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { parts.push(cur); cur = '' } else cur += ch
    }
    parts.push(cur)
    const row = {}
    headers.forEach((h, i) => row[h] = (parts[i] || '').trim())
    return row
  })
}

function buildOverview(data) {
  const totalRecords = data.length
  const intentSet = new Set()
  const entitySet = new Set()
  for (const item of data) {
    const intent = item.intent || item.Intent || item.label
    if (intent) intentSet.add(String(intent))
    const entities = item.entities || item.entity || item.Entities
    if (Array.isArray(entities)) {
      for (const e of entities) entitySet.add(String(e.entity || e))
    } else if (typeof entities === 'string') {
      entitySet.add(entities)
    }
  }
  return { totalRecords, intents: intentSet.size, entities: entitySet.size, sample: data.slice(0, 3) }
}

function suggestIntents(text) {
  const t = (text || '').toLowerCase()
  const suggestions = new Set()
  if (/biryani|biriyani|restaurant|eat|dinner|lunch|food/.test(t)) suggestions.add('book_table')
  if (/flight|book\s+flight|ticket|plane/.test(t)) suggestions.add('book_flight')
  if (/hotel|stay|room/.test(t)) suggestions.add('book_hotel')
  if (/taxi|cab|ride/.test(t)) suggestions.add('book_taxi')
  if (/weather|forecast|temperature/.test(t)) suggestions.add('check_weather')
  return Array.from(suggestions)
}

export default function Workspace({ goToLogin, user, onPageChange }) {
  const [workspaces, setWorkspaces] = useState([])
  const [newWs, setNewWs] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)

  const [file, setFile] = useState(null)
  const [data, setData] = useState([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('')
  const [modelInfo, setModelInfo] = useState(null)
  const overview = useMemo(() => buildOverview(data), [data])

  // Samples from JSON and intent text box
  const [samples, setSamples] = useState([])
  const [utterance, setUtterance] = useState('')
  const [suggested, setSuggested] = useState([])
  const [predictionResult, setPredictionResult] = useState(null)
  const [isPredicting, setIsPredicting] = useState(false)

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState('training')

  useEffect(() => {
    fetch('/data/utterances.json')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) setSamples(list)
      })
      .catch(() => {})
    
    // Load user's workspaces on component mount
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:3001/api/training/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.workspaces) {
        setWorkspaces(response.data.workspaces)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      // Don't show alert for this as it's a background operation
    }
  }

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('User status:', data.user)
        return data.user
      } else {
        console.error('Failed to fetch user profile')
        return null
      }
    } catch (error) {
      console.error('Error checking user status:', error)
      return null
    }
  }

  useEffect(() => {
    setSuggested(suggestIntents(utterance))
  }, [utterance])

  const createWorkspace = async (e) => {
    e.preventDefault()
    const name = newWs.trim()
    if (!name) return
    if (workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      alert('Workspace already exists')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:3001/api/training/workspace', {
        name: name,
        description: `Workspace created by ${user?.username || 'user'}`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Reload workspaces to get the latest data from server
      await loadWorkspaces()
      
      // Find and select the newly created workspace
      const newWorkspace = workspaces.find(w => w.name === name) || {
        id: response.data.workspace.id,
        name: name,
        createdAt: response.data.workspace.createdAt.split('T')[0],
        projectId: response.data.project.id
      }
      setSelectedWorkspace(newWorkspace)
      setNewWs('')
      alert('Workspace and project created successfully')
    } catch (error) {
      console.error('Workspace creation error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create workspace. Please try again.'
      alert(errorMessage)
    }
  }

  const deleteWorkspace = async (id, name) => {
    const ok = confirm(`Delete workspace "${name}"? This will permanently delete the workspace and all associated data. This cannot be undone.`)
    if (!ok) return

    try {
      const token = localStorage.getItem('token')
      
      await axios.delete(`http://localhost:3001/api/training/workspace/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Reload workspaces to get the updated list from server
      await loadWorkspaces()
      
      // Clear selection if the deleted workspace was selected
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(null)
        setModelInfo(null)
        setPredictionResult(null)
        setTrainingStatus('')
      }
      
      alert('Workspace and all associated data deleted successfully')
    } catch (error) {
      console.error('Workspace deletion error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete workspace. Please try again.'
      alert(errorMessage)
    }
  }

  const onSelectFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        let parsed = []
        if (f.name.toLowerCase().endsWith('.json')) {
          const j = JSON.parse(text)
          parsed = Array.isArray(j) ? j : (j.data || [])
        } else if (f.name.toLowerCase().endsWith('.csv')) {
          parsed = parseCsv(text)
        }
        setData(parsed)
        alert('Dataset uploaded')
      } catch (e) {
        console.error(e)
        alert('Failed to parse dataset. Use CSV or JSON array.')
      }
    }
    reader.readAsText(f)
  }

  const applySample = (s) => {
    setUtterance(s.text || '')
  }

  const trainModel = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first')
      return
    }
    if (!file) {
      alert('Please upload a training dataset first')
      return
    }

    // Check user status first
    const userStatus = await checkUserStatus()
    if (!userStatus) {
      alert('Failed to verify user status. Please log in again.')
      return
    }

    if (!userStatus.isApproved) {
      alert('Your account is not approved yet. Please wait for admin approval before training models.')
      return
    }

    setIsTraining(true)
    setTrainingStatus('Training model...')

    try {
      const formData = new FormData()
      formData.append('trainingData', file)
      formData.append('workspaceId', selectedWorkspace.id)

      const token = localStorage.getItem('token')
      
      // Debug: Check if token exists
      if (!token) {
        alert('No authentication token found. Please log in again.')
        return
      }

      console.log('Using token:', token.substring(0, 20) + '...') // Log first 20 chars for debugging

      const response = await axios.post('http://localhost:3001/api/training/upload-and-train', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setTrainingStatus('Model trained successfully!')
      setModelInfo(response.data)
      alert(`Model trained successfully! Supports ${response.data.intents.length} intents.`)
    } catch (error) {
      console.error('Training error:', error)
      setTrainingStatus('Training failed')
      
      // More detailed error handling
      if (error.response?.status === 401) {
        if (error.response?.data?.message?.includes('Invalid token')) {
          alert('Authentication failed. Please log in again.')
          localStorage.removeItem('token')
          window.location.reload()
        } else if (error.response?.data?.message?.includes('not approved')) {
          alert('Your account is not approved yet. Please wait for admin approval.')
        } else {
          alert('Authentication error: ' + error.response?.data?.message)
        }
      } else {
        alert(error.response?.data?.message || 'Training failed')
      }
    } finally {
      setIsTraining(false)
    }
  }

  const predictIntent = async () => {
    if (!selectedWorkspace) {
      alert('Please select a workspace first')
      return
    }
    if (!utterance.trim()) {
      alert('Please enter some text to predict')
      return
    }
    if (!modelInfo) {
      alert('Please train a model first')
      return
    }

    setIsPredicting(true)
    setPredictionResult(null)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:3001/api/training/predict', {
        text: utterance,
        workspaceId: selectedWorkspace.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setPredictionResult(response.data)
    } catch (error) {
      console.error('Prediction error:', error)
      alert(error.response?.data?.message || 'Prediction failed')
    } finally {
      setIsPredicting(false)
    }
  }

  const submitFeedback = async (correctedIntent, feedbackText = '') => {
    if (!predictionResult) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:3001/api/training/submit-feedback', {
        workspaceId: selectedWorkspace.id,
        originalText: predictionResult.text,
        originalIntent: predictionResult.predictedIntent,
        originalConfidence: predictionResult.confidence,
        correctedIntent: correctedIntent,
        feedbackType: 'correction',
        feedbackText: feedbackText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      alert('Feedback submitted successfully! Thank you for helping improve the model.')
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('Failed to submit feedback. Please try again.')
    }
  }

  const selectWorkspace = (workspace) => {
    setSelectedWorkspace(workspace)
    setModelInfo(null)
    setPredictionResult(null)
    setTrainingStatus('')
  }

  return (
    <div className="ws-root">
      <div className="ws-top">
        <div className="ws-brand">Project Workspace</div>
        <div className="ws-spacer" />
        <button className="ws-logout" onClick={goToLogin}>Log out</button>
      </div>

      <div className="ws-columns">
        <div className="ws-left">
          <div className="ws-section-title"><FiFolder /> Workspaces</div>
          <ul className="ws-list">
            {workspaces.map(w => (
              <li key={w.id} className={`ws-item ${selectedWorkspace?.id === w.id ? 'selected' : ''}`}>
                <div className="ws-item-meta" onClick={() => selectWorkspace(w)}>
                  <span className="ws-name">{w.name}</span>
                  <span className="ws-date">Created: {w.createdAt}</span>
                  {w.status && (
                    <span className={`ws-status ws-status-${w.status}`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  )}
                  {w.performance?.accuracy && (
                    <span className="ws-accuracy">
                      Accuracy: {(w.performance.accuracy * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <button 
                  className="ws-delete" 
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteWorkspace(w.id, w.name)
                  }}
                  title="Delete workspace and all associated data"
                >
                  Delete
                </button>
              </li>
            ))}
            {workspaces.length === 0 && (
              <li className="ws-item empty">No workspaces yet. Create your first one below.</li>
            )}
          </ul>
          <form className="ws-create" onSubmit={createWorkspace}>
            <div className="ws-input-row">
              <span className="ws-plus"><FiPlus /></span>
              <input className="ws-input" placeholder="Create New Workspace" value={newWs} onChange={(e)=>setNewWs(e.target.value)} />
            </div>
            <button className="ws-button" type="submit">Create</button>
          </form>

          {samples.length > 0 && (
            <div className="ws-samples">
              <div className="ws-samples-title">Sample Utterances (from JSON)</div>
              <ul className="ws-sample-list">
                {samples.map((s, i) => (
                  <li key={i} className="ws-sample-item" onClick={() => applySample(s)}>{s.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ws-right">
          {/* Tab Navigation */}
          <div className="ws-tabs">
            <button 
              className={`ws-tab ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              <FiUpload /> Training
            </button>
            <button 
              className={`ws-tab ${activeTab === 'evaluation' ? 'active' : ''}`}
              onClick={() => setActiveTab('evaluation')}
            >
              <FiBarChart2 /> Evaluation
            </button>
            <button 
              className={`ws-tab ${activeTab === 'versioning' ? 'active' : ''}`}
              onClick={() => setActiveTab('versioning')}
            >
              <FiGitBranch /> Versioning
            </button>
            <button 
              className={`ws-tab ${activeTab === 'active-learning' ? 'active' : ''}`}
              onClick={() => onPageChange('active-learning')}
            >
              <FiZap /> Active Learning
            </button>
            <button 
              className={`ws-tab ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => onPageChange('feedback')}
            >
              <FiMessageCircle /> Feedback
            </button>
            {user?.role === 'admin' && (
              <button 
                className={`ws-tab admin-tab`}
                onClick={() => onPageChange('admin')}
              >
                <FiSettings /> Admin Panel
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'training' && (
            <>
              <div className="ws-section-title"><FiUpload /> Dataset Upload & Training</div>
          <div className="ws-upload">
            <input type="file" accept=".json" onChange={onSelectFile} />
            {file && <div className="ws-file">Selected: {file.name}</div>}
            {selectedWorkspace && (
              <button 
                className="ws-button" 
                onClick={trainModel} 
                disabled={isTraining || !file}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                {isTraining ? 'Training...' : <><FiCpu /> Train Model</>}
              </button>
            )}
            {trainingStatus && (
              <div className="training-status" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0f8ff', borderRadius: '4px', fontSize: '0.9rem' }}>
                {trainingStatus}
              </div>
            )}
          </div>
          <div className="ws-overview">
            <div className="ov-title">Dataset Overview</div>
            <div className="ov-grid">
              <div className="ov-card"><div className="ov-label">Records</div><div className="ov-value">{overview.totalRecords}</div></div>
              <div className="ov-card"><div className="ov-label">Intents</div><div className="ov-value">{overview.intents}</div></div>
              <div className="ov-card"><div className="ov-label">Entities</div><div className="ov-value">{overview.entities}</div></div>
            </div>
            {overview.sample.length > 0 && (
              <div className="ov-sample">
                <div className="ov-sample-title">Sample</div>
                <pre className="ov-pre">{JSON.stringify(overview.sample, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="ws-intents">
            <div className="ov-title">AI Intent Prediction</div>
            <textarea
              className="ws-textarea"
              rows={4}
              placeholder="Type something like: I want to eat biriyani"
              value={utterance}
              onChange={(e) => setUtterance(e.target.value)}
            />
            <button 
              className="ws-button" 
              onClick={predictIntent} 
              disabled={isPredicting || !utterance.trim() || !modelInfo}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {isPredicting ? 'Predicting...' : <><FiCheck /> Predict Intent</>}
            </button>
            
            {predictionResult && (
              <div className="prediction-result" style={{ marginTop: '1rem', padding: '1rem', background: predictionResult.isUncertain ? '#fff3cd' : '#f0f8ff', borderRadius: '8px', border: `1px solid ${predictionResult.isUncertain ? '#ffc107' : '#e2e8f0'}` }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Prediction Result:
                  {predictionResult.isUncertain && (
                    <span style={{ background: '#ffc107', color: '#856404', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      ⚠️ Uncertain
                    </span>
                  )}
                </div>
                <div><strong>Intent:</strong> {predictionResult.predictedIntent}</div>
                <div><strong>Confidence:</strong> {(predictionResult.confidence * 100).toFixed(1)}%</div>
                {predictionResult.uncertaintyScore && (
                  <div><strong>Uncertainty:</strong> {(predictionResult.uncertaintyScore * 100).toFixed(1)}%</div>
                )}
                {predictionResult.alternatives && predictionResult.alternatives.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Alternatives:</strong>
                    <div className="intent-suggest-list" style={{ marginTop: '0.3rem' }}>
                      {predictionResult.alternatives.map((alt, i) => (
                        <span key={i} className="chip">{alt.intent} ({(alt.confidence * 100).toFixed(1)}%)</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Feedback Section */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Is this prediction correct?</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <button 
                      style={{ background: '#28a745', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => alert('Great! The prediction was correct.')}
                    >
                      ✅ Correct
                    </button>
                    <button 
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => {
                        const correctedIntent = prompt('What should the correct intent be?', predictionResult.predictedIntent);
                        if (correctedIntent && correctedIntent.trim()) {
                          const feedbackText = prompt('Any additional comments? (optional)', '');
                          submitFeedback(correctedIntent.trim(), feedbackText || '');
                        }
                      }}
                    >
                      ❌ Incorrect - Correct it
                    </button>
                  </div>
                  {predictionResult.isUncertain && (
                    <div style={{ fontSize: '0.85rem', color: '#856404' }}>
                      💡 This prediction has low confidence and has been added to the Active Learning queue for review.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="intent-suggest-list" style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Rule-based Suggestions:</div>
              {suggested.length === 0 ? (
                <div className="empty">No suggestions yet.</div>
              ) : (
                suggested.map(s => (
                  <span key={s} className="chip">{s}</span>
                ))
              )}
            </div>
          </div>
            </>
          )}

          {activeTab === 'evaluation' && (
            <EvaluationDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
            />
          )}

          {activeTab === 'versioning' && (
            <ModelVersioningDashboard 
              selectedWorkspace={selectedWorkspace}
              modelInfo={modelInfo}
            />
          )}
        </div>
      </div>
    </div>
  )
}
