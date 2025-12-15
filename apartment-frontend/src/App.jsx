import React, { useState, useEffect } from 'react'
import { 
  MdDashboard, 
  MdPeople, 
  MdHome, 
  MdDescription, 
  MdPayment,
  MdLogout 
} from 'react-icons/md'
import { useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TenantList from './components/TenantList'
import UnitList from './components/UnitList'
import LeaseList from './components/LeaseList'
import PaymentList from './components/PaymentList'
import ConnectionStatus from './components/ConnectionStatus'
import './App.css'

function App() {
  const { user, login, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [message, setMessage] = useState('')

  const handleMessage = (msg, type) => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(''), 3000)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="App loading-screen">
        <div className="loading-content">
          <MdHome className="loading-icon" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLogin={login} />
  }

  // Show main app if authenticated
  return (
    <div className="App">
      <ConnectionStatus />
      <header>
        <div className="header-container">
          <div className="header-brand">
            <MdHome className="header-icon" />
            <h1>Apartment Management</h1>
          </div>
          <div className="header-user">
            <span className="user-name">Welcome, {user.username}</span>
            <button className="logout-button" onClick={logout} title="Logout">
              <MdLogout /> Logout
            </button>
          </div>
        </div>
      </header>

      <nav>
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          <MdDashboard /> Dashboard
        </button>
        <button
          className={activeTab === 'tenants' ? 'active' : ''}
          onClick={() => setActiveTab('tenants')}
        >
          <MdPeople /> Tenants
        </button>
        <button
          className={activeTab === 'units' ? 'active' : ''}
          onClick={() => setActiveTab('units')}
        >
          <MdHome /> Units
        </button>
        <button
          className={activeTab === 'leases' ? 'active' : ''}
          onClick={() => setActiveTab('leases')}
        >
          <MdDescription /> Leases
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          <MdPayment /> Payments
        </button>
      </nav>

      <div className="container">
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="content">
          {activeTab === 'dashboard' && <Dashboard onMessage={handleMessage} />}
          {activeTab === 'tenants' && <TenantList onMessage={handleMessage} />}
          {activeTab === 'units' && <UnitList onMessage={handleMessage} />}
          {activeTab === 'leases' && <LeaseList onMessage={handleMessage} />}
          {activeTab === 'payments' && <PaymentList onMessage={handleMessage} />}
        </div>
      </div>
    </div>
  )
}

export default App
