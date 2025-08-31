'use client'

import React, { useState } from 'react'
import { UserProfile as UserProfileType, Post } from '@/types/shared'
import { trpc } from '@/utils/trpc'
import { Button, Modal } from '@/components/ui'
import EditProfileForm from '../forms/EditProfileForm'
import UserPostsList from './UserPostsList'
import { UserIcon, EditIcon, CalendarIcon } from '@/components/ui/icons'

interface UserProfileProps {
  userId?: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Fetch user profile data
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = trpc.users.getProfile.useQuery({
    userId
  })

  // Fetch user posts
  const { 
    data: userPosts = [], 
    isLoading: postsLoading,
    refetch: refetchPosts
  } = trpc.users.getUserPosts.useQuery({
    userId: userId || 'mock-user-id',
    limit: 20,
    offset: 0
  })

  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      refetchProfile()
      setIsEditModalOpen(false)
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
    }
  })

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  const handleEditProfile = async (data: { username: string; bio: string }) => {
    updateProfileMutation.mutate(data)
  }

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="flex items-start space-x-6 mb-8">
            <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Profile Not Found
          </h2>
          <p className="text-red-600 dark:text-red-400">
            Unable to load the user profile. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* User Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl sm:text-3xl">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {profile.username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  @{profile.username.toLowerCase().replace(/\s+/g, '')}
                </p>
              </div>
              
              {/* Edit Profile Button */}
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                className="mt-3 sm:mt-0 self-start"
              >
                <EditIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Profile Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>Joined {formatDate(profile.joinedAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">{profile.postCount}</span>
                <span className="ml-1">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Posts ({profile.postCount})
          </h2>
        </div>
        
        <UserPostsList 
          userId={profile.id}
          posts={userPosts}
          isLoading={postsLoading}
          onPostUpdate={refetchPosts}
          currentUserId="mock-user-id" // Mock user ID for MVP - in real app would come from auth
        />
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <EditProfileForm
          user={{
            username: profile.username,
            bio: profile.bio || ''
          }}
          onSubmit={handleEditProfile}
          onCancel={() => setIsEditModalOpen(false)}
          isSubmitting={updateProfileMutation.isPending}
        />
      </Modal>
    </div>
  )
}