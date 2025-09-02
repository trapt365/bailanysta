'use client'

import React from 'react'
import Skeleton from './Skeleton'
import PostCardSkeleton from './PostCardSkeleton'

interface UserProfileSkeletonProps {
  showPosts?: boolean
  postCount?: number
  className?: string
}

export default function UserProfileSkeleton({
  showPosts = true,
  postCount = 3,
  className = ''
}: UserProfileSkeletonProps) {
  return (
    <div className={`max-w-4xl mx-auto p-4 lg:p-6 ${className}`}>
      {/* Profile Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* User Avatar Skeleton */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />

          {/* User Info Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                {/* Username Skeleton */}
                <Skeleton width={200} height="2rem" className="rounded" />
                {/* Handle Skeleton */}
                <Skeleton width={150} height="1rem" className="rounded" />
              </div>
              
              {/* Edit Profile Button Skeleton */}
              <div className="mt-3 sm:mt-0 self-start">
                <Skeleton width={120} height="2.5rem" className="rounded-md" />
              </div>
            </div>

            {/* Bio Skeleton */}
            <div className="mt-4 space-y-2">
              <Skeleton height="1.25rem" width="90%" />
              <Skeleton height="1.25rem" width="75%" />
            </div>

            {/* Profile Stats Skeleton */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
              <div className="flex items-center space-x-2">
                <Skeleton width={16} height={16} className="rounded" />
                <Skeleton width={100} height="0.875rem" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton width={30} height="0.875rem" />
                <Skeleton width={40} height="0.875rem" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Section Skeleton */}
      {showPosts && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Skeleton width={60} height="1.5rem" />
              <Skeleton width={40} height="1.5rem" className="rounded-full" />
            </div>
          </div>
          
          {/* Posts List Skeleton */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: postCount }).map((_, index) => (
              <div key={index} className="p-6">
                <PostCardSkeleton showAvatar={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}