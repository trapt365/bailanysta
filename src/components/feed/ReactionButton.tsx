'use client'

import React, { useState, useCallback } from 'react'
import { HeartIcon, HeartIconSolid } from '@/components/ui/icons'
import { Post } from '@/types/shared'
import { trpc } from '@/utils/trpc'

interface ReactionButtonProps {
  post: Post
  onUpdate?: (post: Post) => void
  isLiked?: boolean
}

export default function ReactionButton({ 
  post, 
  onUpdate, 
  isLiked = false
}: ReactionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked)
  const [optimisticCount, setOptimisticCount] = useState(post.reactionCount)

  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSuccess: (data) => {
      // Update the post with the actual reaction count from server
      const updatedPost = { 
        ...post, 
        reactionCount: data.reactionCount 
      }
      onUpdate?.(updatedPost)
    },
    onError: (error) => {
      // Revert optimistic update on error
      setOptimisticLiked(isLiked)
      setOptimisticCount(post.reactionCount)
      console.error('Failed to toggle reaction:', error)
    },
    onSettled: () => {
      // Animation duration
      setTimeout(() => setIsAnimating(false), 300)
    }
  })

  const handleClick = useCallback(async () => {
    // Prevent rapid clicking
    if (toggleReaction.isPending) return

    setIsAnimating(true)

    // Optimistic update
    const newLiked = !optimisticLiked
    const newCount = newLiked 
      ? optimisticCount + 1 
      : optimisticCount - 1

    setOptimisticLiked(newLiked)
    setOptimisticCount(newCount)

    // Trigger the mutation
    toggleReaction.mutate({ postId: post.id })
  }, [toggleReaction, optimisticLiked, optimisticCount, post.id])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Accessibility: Handle Space and Enter key presses
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleClick()
    }
  }, [handleClick])

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={toggleReaction.isPending}
      className={`
        flex items-center space-x-1 px-3 py-1 rounded-full 
        transition-all duration-200 ease-in-out
        hover:bg-red-50 focus:bg-red-50 
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${optimisticLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
      aria-label={optimisticLiked ? 'Unlike this post' : 'Like this post'}
      aria-pressed={optimisticLiked}
      role="button"
      tabIndex={0}
    >
      <div className={`transition-transform duration-300 ${isAnimating ? 'animate-pulse scale-125' : ''}`}>
        {optimisticLiked ? (
          <HeartIconSolid className="w-5 h-5" />
        ) : (
          <HeartIcon className="w-5 h-5" />
        )}
      </div>
      
      <span className="text-sm font-medium">
        {optimisticCount}
      </span>
    </button>
  )
}