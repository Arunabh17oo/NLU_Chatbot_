import React, { useState, useEffect } from 'react'
import './App.css'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Workspace from './Pages/Workspace'
import AdminDashboard from './Pages/AdminDashboard'
import FeedbackDashboard from './Pages/FeedbackDashboard'
import ActiveLearningDashboard from './Pages/ActiveLearningDashboard'

function App() {
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async () => {
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
        setUser(data.user)
        
        // Redirect based on user role and approval status
        if (data.user.role === 'admin') {
          setPage('admin')
        } else if (data.user.isApproved) {
          setPage('workspace')
        } else {
          setPage('pending-approval')
        }
      } else {
        localStorage.removeItem('token')
        setPage('login')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      localStorage.removeItem('token')
      setPage('login')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData.user)
    if (userData.user.role === 'admin') {
      setPage('admin')
    } else if (userData.user.isApproved) {
      setPage('workspace')
    } else {
      setPage('pending-approval')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setPage('login')
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {page === 'login' && (
        <Login 
          goToSignup={() => setPage('signup')} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      {page === 'signup' && (
        <Signup 
          goToLogin={() => setPage('login')} 
          onSignupSuccess={handleLoginSuccess} 
        />
      )}
      {page === 'pending-approval' && (
        <div className="pending-approval">
          <div className="pending-content">
            <h1>Account Pending Approval</h1>
            <p>Your account has been created successfully, but it needs admin approval before you can access the workspace.</p>
            <p>Please wait for an administrator to approve your account.</p>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      )}
      {page === 'workspace' && user && (
        <Workspace 
          goToLogin={handleLogout}
          user={user}
          onPageChange={handlePageChange}
        />
      )}
      {page === 'admin' && user && (
        <AdminDashboard 
          onLogout={handleLogout}
          user={user}
        />
      )}
      {page === 'feedback' && user && (
        <FeedbackDashboard 
          onBack={() => setPage('workspace')}
          user={user}
        />
      )}
      {page === 'active-learning' && user && (
        <ActiveLearningDashboard 
          onBack={() => setPage('workspace')}
          user={user}
        />
      )}
    </div>
  )
}

export default App
