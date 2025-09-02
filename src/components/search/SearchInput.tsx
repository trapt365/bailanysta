'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchInputProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  initialValue?: string
  autoFocus?: boolean
}

/**
 * Search input component for navigation and search page
 * Handles search query state, URL persistence, and keyboard shortcuts
 */
export default function SearchInput({ 
  onSearch, 
  placeholder = "Search posts, hashtags, users...",
  className = '',
  initialValue = '',
  autoFocus = false
}: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Initialize search query from URL params or initial value
  const [query, setQuery] = useState(() => {
    const urlQuery = searchParams.get('q')
    return urlQuery || initialValue
  })

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    
    if (!trimmedQuery) return
    
    // Call custom onSearch handler if provided
    if (onSearch) {
      onSearch(trimmedQuery)
    } else {
      // Default behavior: navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }, [query, onSearch, router])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  // Handle clear button
  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
  }, [])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape key clears the input
    if (e.key === 'Escape') {
      handleClear()
    }
  }, [handleClear])

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Update query when URL params change
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery !== null && urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])

  const baseClasses = "w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
  const combinedClasses = `${baseClasses} ${className}`.trim()

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className="h-5 w-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={combinedClasses}
        aria-label="Search"
        role="searchbox"
        aria-describedby="search-hint"
      />

      {/* Clear Button */}
      {query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
          aria-label="Clear search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Hidden submit button for form submission */}
      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
        Search
      </button>
      
      {/* Screen reader hint */}
      <div id="search-hint" className="sr-only">
        Press Enter to search or Escape to clear
      </div>
    </form>
  )
}