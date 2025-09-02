'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'

interface PopularHashtagsProps {
  limit?: number
  variant?: 'list' | 'cloud'
  className?: string
  showTitle?: boolean
  showCounts?: boolean
  onHashtagClick?: (hashtag: string) => void
}

interface HashtagItem {
  hashtag: string
  count: number
}

/**
 * PopularHashtags component that displays trending hashtags
 * Supports both list and cloud layouts with responsive design
 */
export default function PopularHashtags({
  limit = 10,
  variant = 'list',
  className = '',
  showTitle = true,
  showCounts = true,
  onHashtagClick
}: PopularHashtagsProps) {
  const router = useRouter()

  // Fetch popular hashtags
  const {
    data: hashtags = [],
    isLoading,
    isError,
    error,
    refetch
  } = trpc.search.popularHashtags.useQuery(
    { limit },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    }
  )

  // Handle hashtag click
  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag)
    } else {
      // Default behavior: navigate to hashtag page
      router.push(`/hashtag/${encodeURIComponent(hashtag)}`)
    }
  }

  // Get font size for cloud variant based on usage count
  const getFontSizeForCloud = (count: number, maxCount: number, minCount: number) => {
    if (maxCount === minCount) return 'text-base'
    
    const ratio = (count - minCount) / (maxCount - minCount)
    
    if (ratio > 0.8) return 'text-2xl font-bold'
    if (ratio > 0.6) return 'text-xl font-semibold'
    if (ratio > 0.4) return 'text-lg font-medium'
    if (ratio > 0.2) return 'text-base'
    return 'text-sm'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {showTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Popular Hashtags
          </h3>
        )}
        
        <div className="space-y-3">
          {[...Array(Math.min(limit, 5))].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              {showCounts && (
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {showTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Popular Hashtags
          </h3>
        )}
        
        <div className="text-center py-4">
          <svg className="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Failed to load popular hashtags
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (hashtags.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {showTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Popular Hashtags
          </h3>
        )}
        
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No popular hashtags yet
          </p>
        </div>
      </div>
    )
  }

  // Calculate min/max for cloud sizing
  const counts = hashtags.map(h => h.count)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)

  // Cloud variant
  if (variant === 'cloud') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {showTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Popular Hashtags
          </h3>
        )}
        
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {hashtags.map((hashtag) => (
            <button
              key={hashtag.hashtag}
              onClick={() => handleHashtagClick(hashtag.hashtag)}
              className={`
                ${getFontSizeForCloud(hashtag.count, maxCount, minCount)}
                text-blue-600 dark:text-blue-400 
                hover:text-blue-700 dark:hover:text-blue-300 
                transition-all duration-200 
                hover:scale-110 
                active:scale-95
                px-2 py-1 rounded-md
                hover:bg-blue-50 dark:hover:bg-blue-900/20
              `}
              title={`${hashtag.count} posts with #${hashtag.hashtag}`}
            >
              #{hashtag.hashtag}
            </button>
          ))}
        </div>
        
        {hashtags.length >= limit && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/hashtag')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View all hashtags →
            </button>
          </div>
        )}
      </div>
    )
  }

  // List variant (default)
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {showTitle && (
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Popular Hashtags
        </h3>
      )}
      
      <div className="space-y-2">
        {hashtags.map((hashtag, index) => (
          <button
            key={hashtag.hashtag}
            onClick={() => handleHashtagClick(hashtag.hashtag)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left group"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-400 font-medium text-xs">
                {index + 1}
              </div>
              <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                #{hashtag.hashtag}
              </span>
            </div>
            
            {showCounts && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {hashtags.length >= limit && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push('/hashtag')}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2"
          >
            View all hashtags →
          </button>
        </div>
      )}
    </div>
  )
}