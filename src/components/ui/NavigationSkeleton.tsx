'use client'

import React from 'react'
import Skeleton from './Skeleton'

interface NavigationSkeletonProps {
  className?: string
  showMobileVersion?: boolean
}

export default function NavigationSkeleton({
  className = '',
  showMobileVersion = false
}: NavigationSkeletonProps) {
  if (showMobileVersion) {
    // Mobile Bottom Navigation Skeleton
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center py-2 px-2">
              <Skeleton width={24} height={24} className="rounded" />
              <Skeleton width={40} height="0.75rem" className="mt-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop Navigation Skeleton
  return (
    <nav className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen p-4 hidden lg:block ${className}`}>
      <div className="space-y-2">
        {/* Navigation Items Skeleton */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 px-4 py-3 rounded-lg">
            <Skeleton width={20} height={20} className="rounded" />
            <Skeleton width={80} height="1rem" />
          </div>
        ))}
        
        {/* Create Post Button Skeleton */}
        <div className="mt-4">
          <Skeleton height={40} className="rounded-md" />
        </div>
        
        {/* Theme Toggle Section Skeleton */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4">
            <Skeleton width={50} height="0.875rem" />
            <Skeleton width={40} height={24} className="rounded-full" />
          </div>
        </div>
      </div>
    </nav>
  )
}