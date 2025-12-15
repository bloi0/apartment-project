import React, { useState } from 'react'
import { MdHome, MdLock, MdPerson } from 'react-icons/md'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    setIsLoading(true)

    // Simulate API call - replace with actual authentication
    setTimeout(() => {
      // Demo credentials
      const validUsername = 'property_manager'
      const validPassword = 'SecurePass2025!@#'
      
      if (username === validUsername && password === validPassword) {
        onLogin({ username })
      } else {
        setError('Invalid username or password')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <MdHome className="login-icon" />
          <h1>Apartment Management</h1>
          <p className="login-subtitle">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <MdPerson className="input-icon" />
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <MdLock className="input-icon" />
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-hint">
            <strong>Demo Credentials:</strong><br />
            Username: property_manager<br />
            Password: SecurePass2025!@#
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
