import React, { useState, useEffect } from 'react'
import { 
  MdPeople, 
  MdHome, 
  MdCheckCircle, 
  MdVpnKey, 
  MdDescription, 
  MdPayment,
  MdTrendingUp 
} from 'react-icons/md'
import apiClient from '../api/apiClient'
import './Dashboard.css'

function Dashboard({ onMessage }) {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUnits: 0,
    availableUnits: 0,
    occupiedUnits: 0,
    activeLeases: 0,
    totalPayments: 0,
    recentPayments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [tenantsRes, unitsRes, leasesRes, paymentsRes] = await Promise.all([
        apiClient.get('/tenants'),
        apiClient.get('/units'),
        apiClient.get('/leases'),
        apiClient.get('/payments'),
      ])

      const tenants = tenantsRes.data
      const units = unitsRes.data
      const leases = leasesRes.data
      const payments = paymentsRes.data

      // Calculate stats
      const availableUnits = units.filter(u => u.status === 'available').length
      const occupiedUnits = units.filter(u => u.status === 'occupied').length
      
      const today = new Date()
      const activeLeases = leases.filter(lease => {
        const start = new Date(lease.startDate)
        const end = new Date(lease.endDate)
        return today >= start && today <= end
      }).length

      const recentPayments = payments
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5)

      setStats({
        totalTenants: tenants.length,
        totalUnits: units.length,
        availableUnits,
        occupiedUnits,
        activeLeases,
        totalPayments: payments.length,
        recentPayments,
      })
    } catch (error) {
      onMessage('Failed to fetch dashboard data: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  const occupancyRate = stats.totalUnits > 0 
    ? ((stats.occupiedUnits / stats.totalUnits) * 100).toFixed(1) 
    : 0

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <MdPeople />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Tenants</p>
            <h3>{stats.totalTenants}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">
            <MdHome />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Units</p>
            <h3>{stats.totalUnits}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <p className="stat-label">Available Units</p>
            <h3>{stats.availableUnits}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <MdVpnKey />
          </div>
          <div className="stat-info">
            <p className="stat-label">Occupied Units</p>
            <h3>{stats.occupiedUnits}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <MdDescription />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Leases</p>
            <h3>{stats.activeLeases}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-accent">
          <div className="stat-icon">
            <MdPayment />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Payments</p>
            <h3>{stats.totalPayments}</h3>
          </div>
        </div>
      </div>

      <div className="occupancy-section">
        <div className="section-header">
          <MdTrendingUp className="section-icon" />
          <h3>Occupancy Rate</h3>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${occupancyRate}%` }}
          >
            {occupancyRate}%
          </div>
        </div>
      </div>

      {stats.recentPayments.length > 0 && (
        <div className="recent-payments-section">
          <h3>Recent Payments</h3>
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Tenant ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.paymentId}</td>
                  <td>{payment.tenantId}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.paymentDate}</td>
                  <td>
                    <span className={`status-badge status-${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Dashboard
