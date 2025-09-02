'use client'

import React from 'react'
import HashtagLink from './HashtagLink'

interface HashtagContentProps {
  content: string
  className?: string
}

/**
 * Component that renders text content with clickable hashtag links
 * Automatically detects hashtags in content and makes them clickable
 */
export default function HashtagContent({ content, className = '' }: HashtagContentProps) {
  // Split content by hashtags and create clickable links
  const formatHashtagsInContent = (text: string): React.ReactNode[] => {
    // Enhanced regex to match hashtags with word boundaries
    const hashtagRegex = /(#[a-zA-Z0-9_]+)/g
    const parts = text.split(hashtagRegex)
    
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        // Extract hashtag without the # symbol
        const hashtag = part.slice(1)
        return (
          <HashtagLink
            key={`hashtag-${hashtag}-${index}`}
            hashtag={hashtag}
            className="inline"
          />
        )
      }
      // Regular text
      return part
    })
  }

  return (
    <span className={className}>
      {formatHashtagsInContent(content)}
    </span>
  )
}