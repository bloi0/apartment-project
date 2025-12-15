import React, { useState, useEffect } from 'react'
import apiClient from '../api/apiClient'
import './ConnectionStatus.css'

function ConnectionStatus() {
  const [status, setStatus] = useState('checking') // checking, connected, disconnected
  const [retryCount, setRetryCount] = useState(0)
  const [message, setMessage] = useState('Connecting to backend server...')

  const checkConnection = async () => {
    try {
      // First try health endpoint (faster, lighter)
      await apiClient.get('/health', { timeout: 3000 })
      setStatus('connected')
      setRetryCount(0)
      setMessage('')
    } catch (error) {
      setStatus('disconnected')
      setRetryCount(prev => prev + 1)
      
      // Provide helpful error messages
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setMessage('Backend is slow to respond. It may still be starting up.')
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setMessage('Cannot connect to backend. Make sure Spring Boot is running on port 8080.')
      } else {
        setMessage('Backend connection failed. Retrying...')
      }
    }
  }

  useEffect(() => {
    checkConnection()
    
    // Check connection every 5 seconds if disconnected (faster retry)
    const interval = setInterval(() => {
      if (status !== 'connected') {
        checkConnection()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [status])

  if (status === 'connected') {
    return null // Don't show anything when connected
  }

  return (
    <div className={`connection-status ${status}`}>
      {status === 'checking' && (
        <>
          <div className="spinner"></div>
          <span>{message}</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <div className="warning-icon">⚠️</div>
          <div>
            <div className="status-message">
              Backend server not responding
            </div>
            <div className="status-detail">
              {message}
              {retryCount > 0 && ` (Attempt ${retryCount})`}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ConnectionStatus
