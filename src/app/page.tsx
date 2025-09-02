'use client'

import React, { useState } from 'react'
import { trpc } from '@/utils/trpc'
import CreatePostForm from '@/components/forms/CreatePostForm'
import PostFeed from '@/components/feed/PostFeed'
import { Modal } from '@/components/ui'
import { PopularHashtags } from '@/components/hashtag'
import { CreatePostInput } from '@/types/shared'

export default function Feed() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Create post mutation
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      setShowCreateModal(false)
      // Refresh the feed
      window.location.reload() // Simple refresh for now - in production would use query invalidation
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
    }
  })

  const handleCreatePost = async (data: CreatePostInput) => {
    await createPost.mutateAsync(data)
  }

  const handleOpenCreateModal = () => {
    setShowCreateModal(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Feed</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to Bailanysta! Share your thoughts and discover what others are saying.
        </p>
      </div>

      {/* Quick Post Creation */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        onClick={handleOpenCreateModal}
      >
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">U</span>
          </div>
          <div className="flex-1">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
              What's on your mind?
            </div>
          </div>
        </div>
      </div>

      {/* Popular Hashtags */}
      <div className="mb-6">
        <PopularHashtags 
          limit={6}
          variant="cloud"
          showTitle={true}
          showCounts={false}
        />
      </div>

      {/* Post Feed */}
      <PostFeed />

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create a new post"
      >
        <CreatePostForm
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createPost.isPending}
        />
      </Modal>
    </div>
  );
}
