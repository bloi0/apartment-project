import React, { useState, useEffect } from 'react'
import { MdDescription, MdAdd, MdEdit, MdDelete } from 'react-icons/md'
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tenantId || !formData.unitId || !formData.startDate || !formData.endDate || !formData.rentAmount) {
      onMessage('Please fill in all fields', 'error')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/leases/${editingId}`, {
          ...formData,
          tenantId: parseInt(formData.tenantId),
          unitId: parseInt(formData.unitId),
          rentAmount: parseFloat(formData.rentAmount),
        })
        onMessage('Lease updated successfully', 'success')
      } else {
        await apiClient.post('/leases', {
          ...formData,
          tenantId: parseInt(formData.tenantId),
          unitId: parseInt(formData.unitId),
          rentAmount: parseFloat(formData.rentAmount),
        })
        onMessage('Lease created successfully', 'success')
      }
      setFormData({ tenantId: '', unitId: '', startDate: '', endDate: '', rentAmount: '' })
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
    if (window.confirm('Are you sure you want to delete this lease?')) {
      try {
        await apiClient.delete(`/leases/${id}`)
        onMessage('Lease deleted successfully', 'success')
        fetchLeases()
      } catch (error) {
        onMessage('Failed to delete lease: ' + (error.response?.data?.message || error.message), 'error')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ tenantId: '', unitId: '', startDate: '', endDate: '', rentAmount: '' })
  }

  const getTenantName = (id) => {
    const tenant = tenants.find((t) => t.tenantId === id)
    return tenant ? tenant.name : 'Unknown'
  }

  const getUnitInfo = (id) => {
    const unit = units.find((u) => u.unitId === id)
    return unit ? `${unit.unitNumber} - ${unit.building}` : 'Unknown'
  }

  return (
    <div className="lease-list">
      <div className="list-header">
        <h2>Leases</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add New Lease
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? 'Edit Lease' : 'Add New Lease'}</h3>
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
              <label htmlFor="unitId">Unit</label>
              <select name="unitId" id="unitId" value={formData.unitId} onChange={handleInputChange}>
                <option value="">Select a unit</option>
                {units.map((unit) => (
                  <option key={unit.unitId} value={unit.unitId}>
                    {unit.unitNumber} - {unit.building}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rentAmount">Rent Amount</label>
              <input
                type="number"
                id="rentAmount"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleInputChange}
                placeholder="Enter rent amount"
                step="0.01"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? 'Update Lease' : 'Create Lease'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading leases...</div>
      ) : leases.length === 0 ? (
        <div className="loading">No leases found. Add one to get started!</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Unit</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Rent Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.leaseId}>
                <td>{lease.leaseId}</td>
                <td>{getTenantName(lease.tenantId)}</td>
                <td>{getUnitInfo(lease.unitId)}</td>
                <td>{lease.startDate}</td>
                <td>{lease.endDate}</td>
                <td>${lease.rentAmount.toFixed(2)}</td>
                <td>
                  <button className="btn-primary" onClick={() => handleEdit(lease)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(lease.leaseId)}>
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

export default LeaseList
