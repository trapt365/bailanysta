'use client'

import React, { useState } from 'react'
import { Comment, Post } from '@/types/shared'
import { trpc } from '@/utils/trpc'
import { validateCommentContent, getCharacterCount } from '@/utils/validation'

interface CommentSectionProps {
  post: Post
  onCommentAdded?: (comment: Comment) => void
}

interface CommentInputProps {
  postId: string
  onCommentSubmit: (comment: Comment) => void
}

interface CommentListProps {
  postId: string
  comments: Comment[]
}

function CommentInput({ postId, onCommentSubmit }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        onCommentSubmit({
          ...result.comment,
          createdAt: new Date(result.comment.createdAt)
        })
        setContent('')
      }
    },
    onError: (error) => {
      console.error('Failed to create comment:', error)
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateCommentContent(content)
    if (errors.length > 0) {
      return
    }

    setIsSubmitting(true)
    createCommentMutation.mutate({
      postId,
      content: content.trim()
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const characterCount = getCharacterCount(content)
  const isOverLimit = characterCount > 140
  const isEmpty = content.trim().length === 0

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add comment..."
          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={2}
          disabled={isSubmitting}
        />
        
        {/* Character Counter */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${
              isOverLimit 
                ? 'text-red-500' 
                : characterCount > 120 
                  ? 'text-yellow-500' 
                  : 'text-gray-500'
            }`}>
              {characterCount}/140
            </span>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || isEmpty || isOverLimit}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  )
}

function CommentList({ comments }: CommentListProps) {
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

  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
        No comments yet. Be the first to comment!
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start space-x-3">
          {/* Commenter Avatar */}
          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-xs">
              {comment.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {comment.authorName}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CommentSection({ post, onCommentAdded }: CommentSectionProps) {
  const { data: comments = [], refetch } = trpc.comments.listByPost.useQuery({
    postId: post.id
  })

  const handleCommentAdded = (newComment: Comment) => {
    refetch()
    onCommentAdded?.(newComment)
  }

  return (
    <div className="mt-4">
      <CommentList postId={post.id} comments={comments} />
      <CommentInput postId={post.id} onCommentSubmit={handleCommentAdded} />
    </div>
  )
}