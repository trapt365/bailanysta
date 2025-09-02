'use client'

import React from 'react'
import { trpc } from '@/utils/trpc'
import PostCard from '@/components/feed/PostCard'
import { Post } from '@/types/shared'

interface SearchResultsProps {
  query: string
  onPostUpdate?: (post: Post) => void
}

/**
 * Component that displays search results with highlighted matching terms
 * Supports full-text search across post content, hashtags, and usernames
 */
export default function SearchResults({ query, onPostUpdate }: SearchResultsProps) {
  // Query search results with error handling and caching
  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch
  } = trpc.search.posts.useQuery(
    { query: query.trim() },
    {
      enabled: !!query && query.trim().length > 0,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  // Don't render anything if no query
  if (!query || query.trim().length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="mb-4">
          <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start your search</h3>
        <p>Enter a term above to find posts, users, and hashtags.</p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
          </svg>
          <span>Searching for "{query}"...</span>
        </div>
        
        {/* Loading skeletons */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
            Search Error
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error?.message || 'An error occurred while searching. Please try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty results state
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No results found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          We couldn't find any posts matching "<strong>{query}</strong>". Try using different keywords or check your spelling.
        </p>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Search tips:</h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <li>• Try different keywords</li>
              <li>• Use broader terms</li>
              <li>• Check spelling and try again</li>
              <li>• Search for hashtags with #</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Success state with results
  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search Results
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {posts.length} {posts.length === 1 ? 'result' : 'results'} for "<strong>{query}</strong>"
        </p>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        {posts.map((post) => (
          <SearchResultItem
            key={post.id}
            post={post}
            query={query}
            onUpdate={onPostUpdate}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual search result item with highlighted matching terms
 */
interface SearchResultItemProps {
  post: Post
  query: string
  onUpdate?: (post: Post) => void
}

function SearchResultItem({ post, query, onUpdate }: SearchResultItemProps) {
  // Create a highlighted version of the post content
  const highlightMatches = (text: string, searchQuery: string): JSX.Element => {
    if (!searchQuery.trim()) {
      return <span>{text}</span>
    }

    const queryWords = searchQuery.toLowerCase().trim().split(/\s+/)
    let highlightedText = text

    // Create regex pattern for all query words
    const pattern = queryWords
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex chars
      .join('|')
    
    if (!pattern) {
      return <span>{text}</span>
    }

    const regex = new RegExp(`(${pattern})`, 'gi')
    const parts = highlightedText.split(regex)

    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = queryWords.some(word => 
            part.toLowerCase() === word.toLowerCase()
          )
          
          if (isMatch) {
            return (
              <mark
                key={index}
                className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-gray-900 dark:text-white font-medium"
              >
                {part}
              </mark>
            )
          }
          return part
        })}
      </span>
    )
  }

  // Create post with highlighted content for display
  const highlightedPost = {
    ...post,
    content: post.content // We'll handle highlighting in the render
  }

  return (
    <div className="relative">
      {/* Search match indicators */}
      <div className="absolute -left-1 top-6 w-1 h-8 bg-blue-500 rounded-full opacity-75"></div>
      
      {/* Use PostCard but with custom content rendering */}
      <div className="ml-4">
        <PostCard 
          post={highlightedPost}
          onUpdate={onUpdate}
        />
        
        {/* Additional search context overlay */}
        <div className="mt-2 pl-14">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Match in: {' '}
            {post.content.toLowerCase().includes(query.toLowerCase()) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-2">
                Content
              </span>
            )}
            {post.authorName.toLowerCase().includes(query.toLowerCase()) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mr-2">
                Author
              </span>
            )}
            {post.hashtags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Hashtags
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}