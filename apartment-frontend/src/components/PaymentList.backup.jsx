import React, { useState, useEffect } from 'react'
import apiClient from '../api/apiClient'
import SearchBar from './SearchBar'
import ConfirmModal from './ConfirmModal'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import './PaymentList.css'

function PaymentList({ onMessage }) {
  console.log('PaymentList component rendering')
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, info: '' })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [formData, setFormData] = useState({
    tenantId: '',
    leaseId: '',
    amount: '',
    paymentDate: '',
    status: 'completed',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchPayments()
    fetchTenants()
    fetchLeases()
  }, [])

  useEffect(() => {
    filterAndSortPayments()
  }, [payments, searchTerm, filterStatus, sortConfig])

  const filterAndSortPayments = () => {
    if (!payments || !Array.isArray(payments)) {
      setFilteredPayments([])
      return
    }
    
    let filtered = payments.filter(payment => {
      const tenantName = getTenantName(payment.tenantId).toLowerCase()
      const search = searchTerm.toLowerCase()
      const matchesSearch = tenantName.includes(search) || payment.paymentId.toString().includes(search)
      const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
      
      return matchesSearch && matchesStatus
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        if (sortConfig.key === 'paymentDate') {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    setFilteredPayments(filtered)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.tenantId) {
      errors.tenantId = 'Tenant is required'
    }
    
    if (!formData.leaseId) {
      errors.leaseId = 'Lease is required'
    }
    
    if (!formData.amount) {
      errors.amount = 'Amount is required'
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    
    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const payload = {
        ...formData,
        tenantId: parseInt(formData.tenantId),
        leaseId: parseInt(formData.leaseId),
        amount: parseFloat(formData.amount),
      }
      
      if (editingId) {
        await apiClient.put(`/payments/${editingId}`, payload)
        onMessage('Payment updated successfully', 'success')
      } else {
        await apiClient.post('/payments', payload)
        onMessage('Payment recorded successfully', 'success')
      }
      setFormData({ tenantId: '', leaseId: '', amount: '', paymentDate: '', status: 'completed' })
      setFormErrors({})
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
    setDeleteModal({ isOpen: false, id: null, info: '' })
    try {
      await apiClient.delete(`/payments/${id}`)
      onMessage('Payment deleted successfully', 'success')
      fetchPayments()
    } catch (error) {
      onMessage('Failed to delete payment: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const openDeleteModal = (payment) => {
    const info = `${getTenantName(payment.tenantId)} - ${formatCurrency(payment.amount)}`
    setDeleteModal({ isOpen: true, id: payment.paymentId, info })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ tenantId: '', leaseId: '', amount: '', paymentDate: '', status: 'completed' })
    setFormErrors({})
  }

  const getTenantName = (id) => {
    if (!tenants || !Array.isArray(tenants)) return 'Unknown'
    const tenant = tenants.find((t) => t.tenantId === id)
    return tenant ? tenant.name : 'Unknown'
  }

  const getTenantLeases = () => {
    if (!formData.tenantId) return []
    if (!leases || !Array.isArray(leases)) return []
    return leases.filter(lease => lease.tenantId === parseInt(formData.tenantId))
  }

  const getLeaseInfo = (id) => {
    if (!leases || !Array.isArray(leases)) return 'Unknown'
    const lease = leases.find((l) => l.leaseId === id)
    if (!lease) return 'Unknown'
    return `Lease #${lease.leaseId} (${formatCurrency(lease.rentAmount)}/mo)`
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️'
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const getTotalAmount = () => {
    if (!filteredPayments || !Array.isArray(filteredPayments)) return 0
    return filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0)
  }

  return (
    <div className="payment-list">
      <div className="list-header">
        <h2>Payments</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ➕ Record New Payment
          </button>
        )}
      </div>

      {!showForm && (
        <div className="filters-section">
          <SearchBar 
            placeholder="Search by tenant name or payment ID..." 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="filter-group">
            <label htmlFor="statusFilter">Filter by Status:</label>
            <select 
              id="statusFilter" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      )}

      {!showForm && filteredPayments.length > 0 && (
        <div className="summary-card">
          <div className="summary-item">
            <span className="summary-label">Total Payments:</span>
            <span className="summary-value">{filteredPayments.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completed Amount:</span>
            <span className="summary-value">{formatCurrency(getTotalAmount())}</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? '✏️ Edit Payment' : '➕ Record New Payment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tenantId">Tenant <span className="required">*</span></label>
              <select 
                name="tenantId" 
                id="tenantId" 
                value={formData.tenantId} 
                onChange={handleInputChange}
                className={formErrors.tenantId ? 'error' : ''}
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name} - {tenant.contactInfo}
                  </option>
                ))}
              </select>
              {formErrors.tenantId && <span className="error-message">{formErrors.tenantId}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="leaseId">Lease <span className="required">*</span></label>
              <select 
                name="leaseId" 
                id="leaseId" 
                value={formData.leaseId} 
                onChange={handleInputChange}
                className={formErrors.leaseId ? 'error' : ''}
                disabled={!formData.tenantId}
              >
                <option value="">Select a lease</option>
                {getTenantLeases().map((lease) => (
                  <option key={lease.leaseId} value={lease.leaseId}>
                    Lease #{lease.leaseId} - {formatCurrency(lease.rentAmount)}/month
                  </option>
                ))}
              </select>
              {formErrors.leaseId && <span className="error-message">{formErrors.leaseId}</span>}
              {formData.tenantId && getTenantLeases().length === 0 && (
                <span className="error-message">No active leases found for this tenant</span>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount <span className="required">*</span></label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter payment amount"
                  step="0.01"
                  min="0"
                  className={formErrors.amount ? 'error' : ''}
                />
                {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="paymentDate">Payment Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  className={formErrors.paymentDate ? 'error' : ''}
                />
                {formErrors.paymentDate && <span className="error-message">{formErrors.paymentDate}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange}>
                <option value="completed">✅ Completed</option>
                <option value="pending">⏳ Pending</option>
                <option value="failed">❌ Failed</option>
              </select>
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? '💾 Update Payment' : '✅ Record Payment'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredPayments.length === 0 && searchTerm === '' && filterStatus === 'all' ? (
        <EmptyState
          icon="💰"
          title="No Payments Yet"
          message="Start by recording your first payment. Click the button above to get started."
          actionText="➕ Record First Payment"
          onAction={() => setShowForm(true)}
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Results Found"
          message={`No payments match your search criteria. Try adjusting your filters.`}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('paymentId')} className="sortable">
                  ID{getSortIcon('paymentId')}
                </th>
                <th onClick={() => handleSort('tenantId')} className="sortable">
                  Tenant{getSortIcon('tenantId')}
                </th>
                <th onClick={() => handleSort('leaseId')} className="sortable">
                  Lease{getSortIcon('leaseId')}
                </th>
                <th onClick={() => handleSort('amount')} className="sortable">
                  Amount{getSortIcon('amount')}
                </th>
                <th onClick={() => handleSort('paymentDate')} className="sortable">
                  Payment Date{getSortIcon('paymentDate')}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status{getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.paymentId}</td>
                  <td>{getTenantName(payment.tenantId)}</td>
                  <td>#{payment.leaseId}</td>
                  <td><strong>{formatCurrency(payment.amount)}</strong></td>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>
                    <span className={`status-badge status-${payment.status}`}>{payment.status}</span>
                  </td>
                  <td className="action-buttons">
                    <button className="btn-primary btn-sm" onClick={() => handleEdit(payment)} title="Edit payment">
                      ✏️ Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => openDeleteModal(payment)} title="Delete payment">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, info: '' })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Delete Payment"
        message={`Are you sure you want to delete the payment for "${deleteModal.info}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  )
}

export default PaymentList
