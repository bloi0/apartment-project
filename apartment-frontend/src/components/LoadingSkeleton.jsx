import React from 'react'
import './LoadingSkeleton.css'

function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-wrapper">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-button"></div>
        </div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
