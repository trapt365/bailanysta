'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  animate?: boolean
  count?: number
  width?: string | number
  height?: string | number
}

export default function Skeleton({
  className = '',
  animate = true,
  count = 1,
  width = '100%',
  height = '1rem'
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''}`
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }
  
  if (count === 1) {
    return <div className={`${baseClasses} ${className}`} style={style} />
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${baseClasses} ${className}`} style={style} />
      ))}
    </div>
  )
}