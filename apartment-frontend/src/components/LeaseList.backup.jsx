import React, { useState, useEffect } from 'react'
import apiClient from '../api/apiClient'
import './LeaseList.css'

function LeaseList({ onMessage }) {
  const [leases, setLeases] = useState([])
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    tenantId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
  })

  useEffect(() => {
    fetchLeases()
    fetchTenants()
    fetchUnits()
  }, [])

  const fetchLeases = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/leases')
      setLeases(response.data)
    } catch (error) {
      onMessage('Failed to fetch leases: ' + (error.response?.data?.message || error.message), 'error')
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

  const fetchUnits = async () => {
    try {
      const response = await apiClient.get('/units')
      setUnits(response.data)
    } catch (error) {
      console.error('Failed to fetch units', error)
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
    
    if (!formData.unitId) {
      errors.unitId = 'Unit is required'
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required'
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date'
    }
    
    if (!formData.rentAmount) {
      errors.rentAmount = 'Rent amount is required'
    } else if (parseFloat(formData.rentAmount) <= 0) {
      errors.rentAmount = 'Rent amount must be greater than 0'
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
        unitId: parseInt(formData.unitId),
        rentAmount: parseFloat(formData.rentAmount),
      }
      
      if (editingId) {
        await apiClient.put(`/leases/${editingId}`, payload)
        onMessage('Lease updated successfully', 'success')
      } else {
        await apiClient.post('/leases', payload)
        onMessage('Lease created successfully', 'success')
      }
      setFormData({ tenantId: '', unitId: '', startDate: '', endDate: '', rentAmount: '' })
      setFormErrors({})
      setEditingId(null)
      setShowForm(false)
      fetchLeases()
    } catch (error) {
      onMessage('Failed to save lease: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const handleEdit = (lease) => {
    setFormData({
      tenantId: lease.tenantId.toString(),
      unitId: lease.unitId.toString(),
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount.toString(),
    })
    setEditingId(lease.leaseId)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    setDeleteModal({ isOpen: false, id: null, info: '' })
    try {
      await apiClient.delete(`/leases/${id}`)
      onMessage('Lease deleted successfully', 'success')
      fetchLeases()
    } catch (error) {
      onMessage('Failed to delete lease: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const openDeleteModal = (lease) => {
    const info = `${getTenantName(lease.tenantId)} - ${getUnitInfo(lease.unitId)}`
    setDeleteModal({ isOpen: true, id: lease.leaseId, info })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ tenantId: '', unitId: '', startDate: '', endDate: '', rentAmount: '' })
    setFormErrors({})
  }

  const getTenantName = (id) => {
    if (!tenants || !Array.isArray(tenants)) return 'Unknown'
    const tenant = tenants.find((t) => t.tenantId === id)
    return tenant ? tenant.name : 'Unknown'
  }

  const getTenantNameWithContact = (id) => {
    const tenant = tenants.find((t) => t.tenantId === id)
    return tenant ? `${tenant.name} (${tenant.contactInfo})` : 'Unknown'
  }

  const getUnitInfo = (id) => {
    if (!units || !Array.isArray(units)) return 'Unknown'
    const unit = units.find((u) => u.unitId === id)
    return unit ? `${unit.unitNumber} - ${unit.building}` : 'Unknown'
  }

  const getAvailableUnits = () => {
    if (!units || !Array.isArray(units)) return []
    return units.filter(unit => unit.status === 'available' || editingId)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️'
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const getLeaseStatusBadge = (lease) => {
    const active = isLeaseActive(lease.startDate, lease.endDate)
    const daysLeft = daysUntil(lease.endDate)
    
    if (active && daysLeft < 30) {
      return <span className="status-badge status-pending">Expiring Soon ({daysLeft}d)</span>
    } else if (active) {
      return <span className="status-badge status-completed">Active</span>
    } else if (daysLeft < 0) {
      return <span className="status-badge status-failed">Expired</span>
    } else {
      return <span className="status-badge status-maintenance">Upcoming</span>
    }
  }

  return (
    <div className="lease-list">
      <div className="list-header">
        <h2>Leases</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ➕ Add New Lease
          </button>
        )}
      </div>

      {!showForm && <SearchBar 
        placeholder="Search by tenant or unit..." 
        value={searchTerm}
        onChange={setSearchTerm}
      />}

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? '✏️ Edit Lease' : '➕ Add New Lease'}</h3>
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
              <label htmlFor="unitId">Unit <span className="required">*</span></label>
              <select 
                name="unitId" 
                id="unitId" 
                value={formData.unitId} 
                onChange={handleInputChange}
                className={formErrors.unitId ? 'error' : ''}
              >
                <option value="">Select a unit</option>
                {getAvailableUnits().map((unit) => (
                  <option key={unit.unitId} value={unit.unitId}>
                    {unit.unitNumber} - {unit.building} ({unit.status})
                  </option>
                ))}
              </select>
              {formErrors.unitId && <span className="error-message">{formErrors.unitId}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={formErrors.startDate ? 'error' : ''}
                />
                {formErrors.startDate && <span className="error-message">{formErrors.startDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={formErrors.endDate ? 'error' : ''}
                />
                {formErrors.endDate && <span className="error-message">{formErrors.endDate}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="rentAmount">Monthly Rent <span className="required">*</span></label>
              <input
                type="number"
                id="rentAmount"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleInputChange}
                placeholder="Enter monthly rent amount"
                step="0.01"
                min="0"
                className={formErrors.rentAmount ? 'error' : ''}
              />
              {formErrors.rentAmount && <span className="error-message">{formErrors.rentAmount}</span>}
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? '💾 Update Lease' : '✅ Create Lease'}
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
      ) : filteredLeases.length === 0 && searchTerm === '' ? (
        <EmptyState
          icon="📋"
          title="No Leases Yet"
          message="Start by creating your first lease agreement. Click the button above to get started."
          actionText="➕ Add First Lease"
          onAction={() => setShowForm(true)}
        />
      ) : filteredLeases.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Results Found"
          message={`No leases match "${searchTerm}". Try a different search term.`}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('leaseId')} className="sortable">
                  ID{getSortIcon('leaseId')}
                </th>
                <th onClick={() => handleSort('tenantId')} className="sortable">
                  Tenant{getSortIcon('tenantId')}
                </th>
                <th onClick={() => handleSort('unitId')} className="sortable">
                  Unit{getSortIcon('unitId')}
                </th>
                <th onClick={() => handleSort('startDate')} className="sortable">
                  Start Date{getSortIcon('startDate')}
                </th>
                <th onClick={() => handleSort('endDate')} className="sortable">
                  End Date{getSortIcon('endDate')}
                </th>
                <th onClick={() => handleSort('rentAmount')} className="sortable">
                  Rent{getSortIcon('rentAmount')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease) => (
                <tr key={lease.leaseId}>
                  <td>{lease.leaseId}</td>
                  <td>{getTenantName(lease.tenantId)}</td>
                  <td>{getUnitInfo(lease.unitId)}</td>
                  <td>{formatDate(lease.startDate)}</td>
                  <td>{formatDate(lease.endDate)}</td>
                  <td><strong>{formatCurrency(lease.rentAmount)}</strong></td>
                  <td>{getLeaseStatusBadge(lease)}</td>
                  <td className="action-buttons">
                    <button className="btn-primary btn-sm" onClick={() => handleEdit(lease)} title="Edit lease">
                      ✏️ Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => openDeleteModal(lease)} title="Delete lease">
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
        title="Delete Lease"
        message={`Are you sure you want to delete the lease for "${deleteModal.info}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  )
}

export default LeaseList
