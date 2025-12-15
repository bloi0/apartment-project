import React, { useState, useEffect } from 'react'
import { MdAdd, MdEdit, MdDelete, MdClose, MdPeople, MdSearch } from 'react-icons/md'
import apiClient from '../api/apiClient'
import SearchBar from './SearchBar'
import ConfirmModal from './ConfirmModal'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import './TenantList.css'

function TenantList({ onMessage }) {
  const [tenants, setTenants] = useState([])
  const [filteredTenants, setFilteredTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    filterAndSortTenants()
  }, [tenants, searchTerm, sortConfig])

  const filterAndSortTenants = () => {
    let filtered = tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    setFilteredTenants(filtered)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/tenants')
      setTenants(response.data)
    } catch (error) {
      onMessage('Failed to fetch tenants: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.contactInfo.trim()) {
      errors.contactInfo = 'Contact info is required'
    } else if (!isValidEmail(formData.contactInfo) && !isValidPhone(formData.contactInfo)) {
      errors.contactInfo = 'Please enter a valid email or phone number'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhone = (phone) => {
    return /^[\d\s\-\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/tenants/${editingId}`, formData)
        onMessage('Tenant updated successfully', 'success')
      } else {
        await apiClient.post('/tenants', formData)
        onMessage('Tenant created successfully', 'success')
      }
      setFormData({ name: '', contactInfo: '' })
      setFormErrors({})
      setEditingId(null)
      setShowForm(false)
      fetchTenants()
    } catch (error) {
      onMessage('Failed to save tenant: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const handleEdit = (tenant) => {
    setFormData({
      name: tenant.name,
      contactInfo: tenant.contactInfo,
    })
    setEditingId(tenant.tenantId)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    setDeleteModal({ isOpen: false, id: null, name: '' })
    try {
      await apiClient.delete(`/tenants/${id}`)
      onMessage('Tenant deleted successfully', 'success')
      fetchTenants()
    } catch (error) {
      onMessage('Failed to delete tenant: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const openDeleteModal = (tenant) => {
    setDeleteModal({ isOpen: true, id: tenant.tenantId, name: tenant.name })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', contactInfo: '' })
    setFormErrors({})
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️'
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="tenant-list">
      <div className="list-header">
        <h2>Tenants</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ➕ Add New Tenant
          </button>
        )}
      </div>

      {!showForm && <SearchBar 
        placeholder="Search by name or contact info..." 
        value={searchTerm}
        onChange={setSearchTerm}
      />}

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? '✏️ Edit Tenant' : '➕ Add New Tenant'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter tenant name"
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="contactInfo">Contact Info <span className="required">*</span></label>
              <input
                type="text"
                id="contactInfo"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                placeholder="Enter email or phone"
                className={formErrors.contactInfo ? 'error' : ''}
              />
              {formErrors.contactInfo && <span className="error-message">{formErrors.contactInfo}</span>}
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? '💾 Update Tenant' : '✅ Create Tenant'}
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
      ) : filteredTenants.length === 0 && searchTerm === '' ? (
        <EmptyState
          icon={MdPeople}
          title="No Tenants Yet"
          message="Start by adding your first tenant to the system. Click the button above to get started."
          actionText="Add First Tenant"
          onAction={() => setShowForm(true)}
        />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          icon={MdSearch}
          title="No Results Found"
          message={`No tenants match "${searchTerm}". Try a different search term.`}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('tenantId')} className="sortable">
                  ID{getSortIcon('tenantId')}
                </th>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name{getSortIcon('name')}
                </th>
                <th onClick={() => handleSort('contactInfo')} className="sortable">
                  Contact Info{getSortIcon('contactInfo')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.tenantId}>
                  <td>{tenant.tenantId}</td>
                  <td>{tenant.name}</td>
                  <td>{tenant.contactInfo}</td>
                  <td className="action-buttons">
                    <button className="btn-primary btn-sm" onClick={() => handleEdit(tenant)} title="Edit tenant">
                      ✏️ Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => openDeleteModal(tenant)} title="Delete tenant">
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
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  )
}

export default TenantList
