'use client'

import React, { useState } from 'react'
import { trpc } from '@/utils/trpc'
import { Post } from '@/types/shared'
import PostCard from './PostCard'

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([])

  // Fetch posts using tRPC
  const { data: fetchedPosts = [], isLoading, error } = trpc.posts.list.useQuery(
    { limit: 20 },
    {
      onSuccess: (data) => {
        setPosts(data)
      }
    }
  )

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-16"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
                </div>
                <div className="flex space-x-4 pt-2">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Failed to load posts
        </p>
        <p className="text-red-500 dark:text-red-500 text-sm mt-1">
          {error.message}
        </p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to share something with the community!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onUpdate={handlePostUpdate}
        />
      ))}
    </div>
  )
}