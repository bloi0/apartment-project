import React from 'react'
import { MdAdd } from 'react-icons/md'
import './EmptyState.css'

function EmptyState({ icon: Icon, title, message, actionText, onAction }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionText && onAction && (
        <button className="btn-primary" onClick={onAction}>
          <MdAdd /> {actionText}
        </button>
      )}
    </div>
  )
}

export default EmptyState
