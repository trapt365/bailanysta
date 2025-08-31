'use client'

import React from 'react'
import { Post } from '@/types/shared'
import PostCard from '../feed/PostCard'

interface UserPostsListProps {
  userId: string
  posts: Post[]
  isLoading?: boolean
  onPostUpdate?: () => void
}

export default function UserPostsList({ 
  userId, 
  posts, 
  isLoading = false, 
  onPostUpdate 
}: UserPostsListProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          When this user posts something, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {posts.map((post) => (
        <div key={post.id} className="p-6">
          <PostCard 
            post={post} 
            onUpdate={onPostUpdate}
          />
        </div>
      ))}
    </div>
  )
}