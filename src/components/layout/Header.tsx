'use client'

import Link from 'next/link'
import { NotificationIcon, MessageIcon } from '../ui/icons'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="responsive-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">Bailanysta</span>
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search posts, users, hashtags..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="View notifications"
            >
              <NotificationIcon />
            </button>
            
            <button 
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="View messages"
            >
              <MessageIcon />
            </button>

            <div className="flex items-center">
              <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}