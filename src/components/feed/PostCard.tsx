'use client'

import React, { useState } from 'react'
import { Post, Comment } from '@/types/shared'
import { trpc } from '@/utils/trpc'
import ReactionButton from './ReactionButton'
import CommentSection from './CommentSection'
import { MessageIcon } from '@/components/ui/icons'
import { HashtagLink, HashtagContent } from '@/components/hashtag'

interface PostCardProps {
  post: Post
  onUpdate?: (post: Post) => void
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [localPost, setLocalPost] = useState(post)

  // Check if user has reacted to this post
  const { data: hasUserReacted = false } = trpc.reactions.hasUserReacted.useQuery({
    postId: post.id
  })

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    
    return dateObj.toLocaleDateString()
  }

  const getMoodEmoji = (mood?: Post['mood']) => {
    switch (mood) {
      case 'Happy': return '😊'
      case 'Thoughtful': return '🤔'
      case 'Excited': return '🎉'
      case 'Contemplative': return '🧘'
      case 'Energetic': return '⚡'
      default: return null
    }
  }

  const handleCommentAdded = (comment: Comment) => {
    // Update local post comment count
    const updatedPost = { ...localPost, commentCount: localPost.commentCount + 1 }
    setLocalPost(updatedPost)
    onUpdate?.(updatedPost)
  }

  const toggleComments = () => {
    setShowComments(!showComments)
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none animate-fade-in">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-medium text-sm">
            {post.authorName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {post.authorName}
            </span>
            <span className="text-gray-500 text-sm">
              @{post.authorName.toLowerCase().replace(/\s+/g, '')}
            </span>
            <span className="text-gray-500 text-sm">·</span>
            <time 
              className="text-gray-500 text-sm"
              dateTime={typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString()}
            >
              {formatDate(post.createdAt)}
            </time>
            {post.mood && (
              <>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-sm" title={`Feeling ${post.mood}`}>
                  {getMoodEmoji(post.mood)}
                </span>
              </>
            )}
          </div>

          {/* Post Text */}
          <div className="mb-3">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
              <HashtagContent content={post.content} />
            </p>
            
            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {post.hashtags.map((hashtag) => (
                  <HashtagLink
                    key={hashtag}
                    hashtag={hashtag}
                    className="hover:scale-105 transition-transform duration-200"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-6 text-gray-500">
            {/* Comments */}
            <button 
              onClick={toggleComments}
              className={`flex items-center space-x-2 transition-all duration-200 rounded-full p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-110 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none ${
                showComments 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'hover:text-blue-600'
              }`}
            >
              <MessageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{localPost.commentCount}</span>
            </button>

            {/* Reactions */}
            <ReactionButton 
              post={localPost} 
              onUpdate={(updatedPost) => {
                setLocalPost(updatedPost)
                onUpdate?.(updatedPost)
              }}
              isLiked={hasUserReacted}
            />

            {/* Share/Repost placeholder */}
            <button className="flex items-center space-x-2 hover:text-green-600 transition-all duration-200 rounded-full p-1 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-110 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm font-medium">0</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          post={localPost}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </article>
  )
}