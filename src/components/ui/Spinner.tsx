'use client'

import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'current'
  className?: string
  'aria-label'?: string
}

export default function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  'aria-label': ariaLabel = 'Loading'
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  const colorClasses = {
    primary: 'border-blue-600 dark:border-blue-400',
    secondary: 'border-gray-600 dark:border-gray-400',
    current: 'border-current'
  }
  
  const borderWidth = size === 'sm' ? 'border-2' : size === 'md' ? 'border-2' : 'border-4'
  
  return (
    <div
      className={`
        animate-spin rounded-full ${borderWidth} border-transparent ${colorClasses[color]} border-t-current
        ${sizeClasses[size]} ${className}
      `}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}