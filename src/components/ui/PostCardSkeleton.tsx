'use client'

import React from 'react'
import Skeleton from './Skeleton'

interface PostCardSkeletonProps {
  showAvatar?: boolean
  showActions?: boolean
  className?: string
}

export default function PostCardSkeleton({
  showAvatar = true,
  showActions = true,
  className = ''
}: PostCardSkeletonProps) {
  return (
    <article className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* User Avatar Skeleton */}
        {showAvatar && (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
        )}

        {/* Post Content Skeleton */}
        <div className="flex-1 min-w-0">
          {/* Post Header Skeleton */}
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton width={100} height="1rem" className="rounded" />
            <Skeleton width={60} height="0.875rem" />
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <Skeleton width={30} height="0.875rem" />
          </div>

          {/* Post Text Skeleton */}
          <div className="mb-3 space-y-2">
            <Skeleton height="1.25rem" />
            <Skeleton height="1.25rem" width="85%" />
            <Skeleton height="1.25rem" width="60%" />
          </div>

          {/* Hashtags Skeleton */}
          <div className="mb-3 flex space-x-2">
            <Skeleton width={60} height="1rem" className="rounded-full" />
            <Skeleton width={80} height="1rem" className="rounded-full" />
            <Skeleton width={50} height="1rem" className="rounded-full" />
          </div>

          {/* Post Actions Skeleton */}
          {showActions && (
            <div className="flex items-center space-x-6">
              {/* Comments Skeleton */}
              <div className="flex items-center space-x-2">
                <Skeleton width={16} height={16} className="rounded" />
                <Skeleton width={20} height="0.875rem" />
              </div>

              {/* Reactions Skeleton */}
              <div className="flex items-center space-x-2">
                <Skeleton width={16} height={16} className="rounded" />
                <Skeleton width={20} height="0.875rem" />
              </div>

              {/* Share Skeleton */}
              <div className="flex items-center space-x-2">
                <Skeleton width={16} height={16} className="rounded" />
                <Skeleton width={20} height="0.875rem" />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}