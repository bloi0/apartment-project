// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Format date to readable format
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Get status color class
export const getStatusColor = (status) => {
  const statusMap = {
    available: 'success',
    occupied: 'danger',
    maintenance: 'warning',
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
  }
  return statusMap[status] || 'secondary'
}

// Calculate days until date
export const daysUntil = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Check if lease is active
export const isLeaseActive = (startDate, endDate) => {
  const today = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  return today >= start && today <= end
}
