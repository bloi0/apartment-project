import React from 'react'
import { MdSearch, MdClear } from 'react-icons/md'
import './SearchBar.css'

function SearchBar({ placeholder = "Search...", value, onChange }) {
  return (
    <div className="search-bar">
      <MdSearch className="search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
      {value && (
        <button className="clear-button" onClick={() => onChange('')}>
          <MdClear />
        </button>
      )}
    </div>
  )
}

export default SearchBar
