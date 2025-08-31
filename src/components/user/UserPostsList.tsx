'use client'

import React, { useState } from 'react'
import { Post, UpdatePostInput } from '@/types/shared'
import { trpc } from '@/utils/trpc'
import PostCard from '../feed/PostCard'
import EditPostForm from '../forms/EditPostForm'
import { Modal, Button } from '@/components/ui'

interface UserPostsListProps {
  userId: string
  posts: Post[]
  isLoading?: boolean
  onPostUpdate?: () => void
  currentUserId?: string // Added to determine ownership
}

export default function UserPostsList({ 
  userId, 
  posts, 
  isLoading = false, 
  onPostUpdate,
  currentUserId = 'mock-user-id' // Mock user ID for MVP
}: UserPostsListProps) {
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<Post | null>(null)

  // Post update mutation
  const updatePostMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      onPostUpdate?.()
      setEditingPost(null)
    },
    onError: (error) => {
      console.error('Failed to update post:', error)
      alert('Failed to update post. Please try again.')
    }
  })

  // Post delete mutation
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      onPostUpdate?.()
      setDeleteConfirmPost(null)
    },
    onError: (error) => {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    }
  })

  const handleEditPost = async (data: UpdatePostInput) => {
    updatePostMutation.mutate(data)
  }

  const handleDeletePost = () => {
    if (deleteConfirmPost) {
      deletePostMutation.mutate({ id: deleteConfirmPost.id })
    }
  }

  const isOwner = (post: Post) => post.authorId === currentUserId
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          When this user posts something, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {posts.map((post) => (
          <div key={post.id} className="relative">
            {editingPost?.id === post.id ? (
              <div className="p-6">
                <EditPostForm 
                  post={post}
                  onSave={handleEditPost}
                  onCancel={() => setEditingPost(null)}
                  isLoading={updatePostMutation.isPending}
                />
              </div>
            ) : (
              <div className="p-6">
                <div className="relative">
                  <PostCard 
                    post={post} 
                    onUpdate={onPostUpdate}
                  />
                  
                  {/* Management buttons for post owner */}
                  {isOwner(post) && (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit post"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmPost(post)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete post"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmPost}
        onClose={() => setDeleteConfirmPost(null)}
        title="Delete Post"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this post? This action cannot be undone.
            All comments and reactions will also be removed.
          </p>
          
          {deleteConfirmPost && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
              <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
                {deleteConfirmPost.content}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmPost(null)}
              disabled={deletePostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              loading={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? 'Deleting...' : 'Delete Post'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}