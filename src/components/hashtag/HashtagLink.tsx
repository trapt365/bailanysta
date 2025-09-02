'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface HashtagLinkProps {
  hashtag: string
  className?: string
  onClick?: (hashtag: string) => void
}

/**
 * Clickable hashtag component that navigates to hashtag feed page
 * Follows design system with blue styling and hover effects
 */
export default function HashtagLink({ hashtag, className = '', onClick }: HashtagLinkProps) {
  const router = useRouter()

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation() // Prevent parent click handlers (e.g., post card)
    
    // Call custom onClick handler if provided
    if (onClick) {
      onClick(hashtag)
      return
    }
    
    // Default navigation to hashtag page
    const encodedHashtag = encodeURIComponent(hashtag)
    router.push(`/hashtag/${encodedHashtag}`)
  }

  const baseClasses = "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors duration-200 text-sm font-medium"
  const combinedClasses = `${baseClasses} ${className}`.trim()

  return (
    <button
      type="button"
      onClick={handleClick}
      className={combinedClasses}
      aria-label={`View posts with hashtag ${hashtag}`}
      title={`Click to see all posts tagged with #${hashtag}`}
    >
      #{hashtag}
    </button>
  )
}