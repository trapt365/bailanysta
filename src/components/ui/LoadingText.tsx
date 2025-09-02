'use client'

import React from 'react'

interface LoadingTextProps {
  text?: string
  className?: string
  dotColor?: string
  'aria-label'?: string
}

export default function LoadingText({
  text = 'Loading',
  className = '',
  dotColor = 'text-gray-500 dark:text-gray-400',
  'aria-label': ariaLabel = 'Loading content'
}: LoadingTextProps) {
  return (
    <div 
      className={`flex items-center space-x-1 ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <span>{text}</span>
      <div className="flex space-x-1">
        <div 
          className={`w-1 h-1 rounded-full animate-pulse ${dotColor}`}
          style={{ animationDelay: '0ms', animationDuration: '1.5s' }}
        />
        <div 
          className={`w-1 h-1 rounded-full animate-pulse ${dotColor}`}
          style={{ animationDelay: '500ms', animationDuration: '1.5s' }}
        />
        <div 
          className={`w-1 h-1 rounded-full animate-pulse ${dotColor}`}
          style={{ animationDelay: '1000ms', animationDuration: '1.5s' }}
        />
      </div>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}