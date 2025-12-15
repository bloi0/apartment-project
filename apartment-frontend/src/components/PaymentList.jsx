import React, { useState, useEffect } from 'react'
import { MdPayment, MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import apiClient from '../api/apiClient'
import './PaymentList.css'

function PaymentList({ onMessage }) {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    tenantId: '',
    leaseId: '',
    amount: '',
    paymentDate: '',
    status: 'completed',
  })

  useEffect(() => {
    fetchPayments()
    fetchTenants()
    fetchLeases()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/payments')
      setPayments(response.data)
    } catch (error) {
      onMessage('Failed to fetch payments: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/tenants')
      setTenants(response.data)
    } catch (error) {
      console.error('Failed to fetch tenants', error)
    }
  }

  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/leases')
      setLeases(response.data)
    } catch (error) {
      console.error('Failed to fetch leases', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tenantId || !formData.leaseId || !formData.amount || !formData.paymentDate) {
      onMessage('Please fill in all fields', 'error')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/payments/${editingId}`, {
          ...formData,
          tenantId: parseInt(formData.tenantId),
          leaseId: parseInt(formData.leaseId),
          amount: parseFloat(formData.amount),
        })
        onMessage('Payment updated successfully', 'success')
      } else {
        await apiClient.post('/payments', {
          ...formData,
          tenantId: parseInt(formData.tenantId),
          leaseId: parseInt(formData.leaseId),
          amount: parseFloat(formData.amount),
        })
        onMessage('Payment created successfully', 'success')
      }
      setFormData({ tenantId: '', leaseId: '', amount: '', paymentDate: '', status: 'completed' })
      setEditingId(null)
      setShowForm(false)
      fetchPayments()
    } catch (error) {
      onMessage('Failed to save payment: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const handleEdit = (payment) => {
    setFormData({
      tenantId: payment.tenantId.toString(),
      leaseId: payment.leaseId.toString(),
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate,
      status: payment.status,
    })
    setEditingId(payment.paymentId)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await apiClient.delete(`/payments/${id}`)
        onMessage('Payment deleted successfully', 'success')
        fetchPayments()
      } catch (error) {
        onMessage('Failed to delete payment: ' + (error.response?.data?.message || error.message), 'error')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ tenantId: '', leaseId: '', amount: '', paymentDate: '', status: 'completed' })
  }

  const getTenantName = (id) => {
    const tenant = tenants.find((t) => t.tenantId === id)
    return tenant ? tenant.name : 'Unknown'
  }

  return (
    <div className="payment-list">
      <div className="list-header">
        <h2>Payments</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Record New Payment
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? 'Edit Payment' : 'Record New Payment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tenantId">Tenant</label>
              <select name="tenantId" id="tenantId" value={formData.tenantId} onChange={handleInputChange}>
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="leaseId">Lease</label>
              <select name="leaseId" id="leaseId" value={formData.leaseId} onChange={handleInputChange}>
                <option value="">Select a lease</option>
                {leases.map((lease) => (
                  <option key={lease.leaseId} value={lease.leaseId}>
                    Lease #{lease.leaseId}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter payment amount"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="paymentDate">Payment Date</label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? 'Update Payment' : 'Record Payment'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="loading">No payments found. Record one to get started!</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Lease ID</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.paymentId}>
                <td>{payment.paymentId}</td>
                <td>{getTenantName(payment.tenantId)}</td>
                <td>{payment.leaseId}</td>
                <td>${payment.amount.toFixed(2)}</td>
                <td>{payment.paymentDate}</td>
                <td>
                  <span className={`status-badge status-${payment.status}`}>{payment.status}</span>
                </td>
                <td>
                  <button className="btn-primary" onClick={() => handleEdit(payment)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(payment.paymentId)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PaymentList
