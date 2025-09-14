import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './Workspace.css'
import { FiPlus, FiFolder, FiUpload, FiCpu, FiCheck, FiBarChart2, FiGitBranch } from 'react-icons/fi'
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

export default function Workspace({ goToLogin }) {
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
  }, [])

  useEffect(() => {
    setSuggested(suggestIntents(utterance))
  }, [utterance])

  const createWorkspace = (e) => {
    e.preventDefault()
    const name = newWs.trim()
    if (!name) return
    if (workspaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      alert('Workspace already exists')
      return
    }
    const d = new Date()
    const createdAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const workspaceId = String(Date.now())
    const newWorkspace = { id: workspaceId, name, createdAt }
    setWorkspaces([newWorkspace, ...workspaces])
    setSelectedWorkspace(newWorkspace)
    setNewWs('')
    alert('Workspace created')
  }

  const deleteWorkspace = (id, name) => {
    const ok = confirm(`Delete workspace "${name}"? This cannot be undone.`)
    if (!ok) return
    setWorkspaces(prev => prev.filter(w => w.id !== id))
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

    setIsTraining(true)
    setTrainingStatus('Training model...')

    try {
      const formData = new FormData()
      formData.append('trainingData', file)
      formData.append('workspaceId', selectedWorkspace.id)

      const token = localStorage.getItem('auth_token')
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
      alert(error.response?.data?.message || 'Training failed')
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
      const token = localStorage.getItem('auth_token')
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
                </div>
                <button className="ws-delete" onClick={() => deleteWorkspace(w.id, w.name)}>Delete</button>
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
              <div className="prediction-result" style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Prediction Result:</div>
                <div><strong>Intent:</strong> {predictionResult.predictedIntent}</div>
                <div><strong>Confidence:</strong> {(predictionResult.confidence * 100).toFixed(1)}%</div>
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
