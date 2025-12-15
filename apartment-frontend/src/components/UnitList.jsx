import React, { useState, useEffect } from 'react'
import { MdHome, MdSearch, MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import apiClient from '../api/apiClient'
import SearchBar from './SearchBar'
import ConfirmModal from './ConfirmModal'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import './UnitList.css'

function UnitList({ onMessage }) {
  const [units, setUnits] = useState([])
  const [filteredUnits, setFilteredUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, unitNumber: '' })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [formData, setFormData] = useState({
    unitNumber: '',
    building: '',
    status: 'available',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    filterAndSortUnits()
  }, [units, searchTerm, filterStatus, sortConfig])

  const filterAndSortUnits = () => {
    let filtered = units.filter(unit => {
      const matchesSearch = 
        unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.building.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || unit.status === filterStatus
      
      return matchesSearch && matchesStatus
    })

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

    setFilteredUnits(filtered)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const fetchUnits = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/units')
      setUnits(response.data)
    } catch (error) {
      onMessage('Failed to fetch units: ' + (error.response?.data?.message || error.message), 'error')
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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.unitNumber.trim()) {
      errors.unitNumber = 'Unit number is required'
    }
    
    if (!formData.building.trim()) {
      errors.building = 'Building is required'
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
      if (editingId) {
        await apiClient.put(`/units/${editingId}`, formData)
        onMessage('Unit updated successfully', 'success')
      } else {
        await apiClient.post('/units', formData)
        onMessage('Unit created successfully', 'success')
      }
      setFormData({ unitNumber: '', building: '', status: 'available' })
      setFormErrors({})
      setEditingId(null)
      setShowForm(false)
      fetchUnits()
    } catch (error) {
      onMessage('Failed to save unit: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const handleEdit = (unit) => {
    setFormData({
      unitNumber: unit.unitNumber,
      building: unit.building,
      status: unit.status,
    })
    setEditingId(unit.unitId)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    setDeleteModal({ isOpen: false, id: null, unitNumber: '' })
    try {
      await apiClient.delete(`/units/${id}`)
      onMessage('Unit deleted successfully', 'success')
      fetchUnits()
    } catch (error) {
      onMessage('Failed to delete unit: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const openDeleteModal = (unit) => {
    setDeleteModal({ isOpen: true, id: unit.unitId, unitNumber: unit.unitNumber })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ unitNumber: '', building: '', status: 'available' })
    setFormErrors({})
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️'
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="unit-list">
      <div className="list-header">
        <h2>Units</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ➕ Add New Unit
          </button>
        )}
      </div>

      {!showForm && (
        <div className="filters-section">
          <SearchBar 
            placeholder="Search by unit number or building..." 
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
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <h3>{editingId ? '✏️ Edit Unit' : '➕ Add New Unit'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="unitNumber">Unit Number <span className="required">*</span></label>
              <input
                type="text"
                id="unitNumber"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleInputChange}
                placeholder="e.g., 101, 201A"
                className={formErrors.unitNumber ? 'error' : ''}
              />
              {formErrors.unitNumber && <span className="error-message">{formErrors.unitNumber}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="building">Building <span className="required">*</span></label>
              <input
                type="text"
                id="building"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                placeholder="e.g., Main Building, North Wing"
                className={formErrors.building ? 'error' : ''}
              />
              {formErrors.building && <span className="error-message">{formErrors.building}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange}>
                <option value="available">✅ Available</option>
                <option value="occupied">🔑 Occupied</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
            </div>
            <div className="button-group">
              <button type="submit" className="btn-success">
                {editingId ? '💾 Update Unit' : '✅ Create Unit'}
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
      ) : filteredUnits.length === 0 && searchTerm === '' && filterStatus === 'all' ? (
        <EmptyState
          icon={MdHome}
          title="No Units Yet"
          message="Start by adding your first unit to the system. Click the button above to get started."
          actionText="Add First Unit"
          onAction={() => setShowForm(true)}
        />
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          icon={MdSearch}
          title="No Results Found"
          message={`No units match your search criteria. Try adjusting your filters.`}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('unitId')} className="sortable">
                  ID{getSortIcon('unitId')}
                </th>
                <th onClick={() => handleSort('unitNumber')} className="sortable">
                  Unit Number{getSortIcon('unitNumber')}
                </th>
                <th onClick={() => handleSort('building')} className="sortable">
                  Building{getSortIcon('building')}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status{getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.unitId}>
                  <td>{unit.unitId}</td>
                  <td><strong>{unit.unitNumber}</strong></td>
                  <td>{unit.building}</td>
                  <td>
                    <span className={`status-badge status-${unit.status}`}>{unit.status}</span>
                  </td>
                  <td className="action-buttons">
                    <button className="btn-primary btn-sm" onClick={() => handleEdit(unit)} title="Edit unit">
                      ✏️ Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => openDeleteModal(unit)} title="Delete unit">
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
        onClose={() => setDeleteModal({ isOpen: false, id: null, unitNumber: '' })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Delete Unit"
        message={`Are you sure you want to delete unit "${deleteModal.unitNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  )
}

export default UnitList
