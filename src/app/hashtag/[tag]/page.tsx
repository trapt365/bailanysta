'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import HashtagFeed from '@/components/feed/HashtagFeed'
import { Post } from '@/types/shared'

interface HashtagPageProps {
  params: {
    tag: string
  }
}

/**
 * Dynamic hashtag page that displays posts filtered by a specific hashtag
 * URL: /hashtag/[tag] - e.g., /hashtag/coding shows posts with #coding hashtag
 * Includes URL state persistence for shareable hashtag feeds
 */
export default function HashtagPage() {
  const params = useParams()
  const router = useRouter()
  
  // Get the hashtag from URL params and decode it
  const tag = typeof params.tag === 'string' ? decodeURIComponent(params.tag) : ''
  
  // Handle post updates (refresh counts, etc.)
  const handlePostUpdate = (updatedPost: Post) => {
    // Post updates are handled by the PostCard component
    // This could trigger a refetch of the hashtag feed if needed
    console.log('Post updated:', updatedPost.id)
  }

  // Handle back navigation
  const handleBackClick = () => {
    router.back()
  }

  // Handle navigation to hashtag exploration page
  const handleExploreHashtags = () => {
    router.push('/hashtag')
  }

  if (!tag) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833-.23 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Hashtag
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The hashtag you're looking for couldn't be found.
          </p>
          <button
            onClick={handleExploreHashtags}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Explore Hashtags
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        
        <button
          onClick={handleExploreHashtags}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
        >
          Explore All Hashtags
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Hashtag Feed */}
      <HashtagFeed 
        hashtag={tag}
        onPostUpdate={handlePostUpdate}
      />
    </div>
  )
}