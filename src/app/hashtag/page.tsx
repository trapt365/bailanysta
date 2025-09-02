'use client'

import React from 'react'
import { PopularHashtags } from '@/components/hashtag'

export default function Hashtag() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Trending</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover what's trending on Bailanysta right now.
        </p>
      </div>

      {/* Popular Hashtags - List View */}
      <div className="mb-6">
        <PopularHashtags 
          limit={10}
          variant="list"
          showTitle={true}
          showCounts={true}
        />
      </div>

      {/* Popular Hashtags - Cloud View */}
      <div className="mb-6">
        <PopularHashtags 
          limit={15}
          variant="cloud"
          showTitle={true}
          showCounts={false}
          className="mb-0"
        />
      </div>

      {/* Trending Topics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">What's Happening</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-foreground">Platform Launch</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Bailanysta officially launches with new features for community building.
            </p>
            <span className="text-xs text-gray-500">Trending in Technology</span>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-foreground">Community Growth</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              New users are joining and sharing their first posts on the platform.
            </p>
            <span className="text-xs text-gray-500">Trending in Community</span>
          </div>
        </div>
      </div>

      {/* Suggested Hashtags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-foreground mb-4">Suggested for You</h3>
        <div className="flex flex-wrap gap-2">
          {['#newbie', '#help', '#questions', '#community', '#feedback', '#suggestions'].map((tag) => (
            <button
              key={tag}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}