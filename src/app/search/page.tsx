'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchInput, SearchResults } from '@/components/search'
import { Post } from '@/types/shared'

/**
 * Search page with full-text search functionality
 * URL: /search?q=query - supports URL state persistence for shareable searches
 */
export default function Search() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get search query from URL params
  const query = searchParams.get('q') || ''

  // Handle post updates in search results
  const handlePostUpdate = (updatedPost: Post) => {
    console.log('Post updated in search:', updatedPost.id)
    // Post updates are handled by individual PostCard components
  }

  // Handle search category clicks
  const handleCategoryClick = (category: string) => {
    const searchQuery = category === 'hashtags' ? '#' : category.slice(0, -1) // Remove 's' for singular
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Search</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find posts, users, and hashtags across Bailanysta.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <SearchInput 
          placeholder="Search for posts, users, or hashtags..."
          autoFocus={!query} // Auto-focus only if no query present
        />
      </div>

      {/* Search Results or Categories */}
      {query ? (
        <SearchResults 
          query={query} 
          onPostUpdate={handlePostUpdate}
        />
      ) : (
        <>
          {/* Search Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Search Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => handleCategoryClick('posts')}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Posts</h4>
                    <p className="text-sm text-gray-500">Find posts by content</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => handleCategoryClick('users')}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Users</h4>
                    <p className="text-sm text-gray-500">Discover new people</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => handleCategoryClick('hashtags')}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">#</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Hashtags</h4>
                    <p className="text-sm text-gray-500">Explore trending topics</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Searches - Placeholder for future feature */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2">
              {['#coding', '#javascript', '#react', '#design', '#technology', '#introduction'].map((term) => (
                <button
                  key={term}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}