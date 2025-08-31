'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { HomeIcon, UserIcon, SearchIcon, TrendingIcon, PlusIcon } from '../ui/icons'
import { Modal, Button } from '../ui'
import CreatePostForm from '../forms/CreatePostForm'
import { CreatePostInput } from '@/types/shared'
import { trpc } from '@/utils/trpc'
import { usePostsStore, createOptimisticPost } from '@/stores/postsStore'

const navigationItems = [
  { href: '/', label: 'Feed', icon: 'home' },
  { href: '/profile', label: 'Profile', icon: 'user' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/hashtag', label: 'Trending', icon: 'trending' },
] as const

const IconComponent = ({ icon }: { icon: string }) => {
  const iconMap = {
    home: HomeIcon,
    user: UserIcon,
    search: SearchIcon,
    trending: TrendingIcon,
    plus: PlusIcon,
  } as const
  
  const IconComp = iconMap[icon as keyof typeof iconMap]
  return IconComp ? <IconComp /> : null
}

export default function Navigation() {
  const pathname = usePathname()
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const { addOptimisticPost, removeOptimisticPost } = usePostsStore()
  
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: (result, variables) => {
      // Remove optimistic post and add real post
      const optimisticId = `optimistic-${variables.content.slice(0, 10)}`
      removeOptimisticPost(optimisticId)
      
      setIsCreatePostModalOpen(false)
      console.log('Post created successfully!')
    },
    onError: (error, variables) => {
      // Remove failed optimistic post
      const optimisticId = `optimistic-${variables.content.slice(0, 10)}`
      removeOptimisticPost(optimisticId)
      
      console.error('Failed to create post:', error)
    }
  })

  const handleCreatePost = async (data: CreatePostInput) => {
    // Add optimistic post immediately
    const optimisticPost = createOptimisticPost(data.content, data.mood)
    // Use a more predictable ID for removal
    optimisticPost.id = `optimistic-${data.content.slice(0, 10)}`
    addOptimisticPost(optimisticPost)
    
    // Trigger actual API call
    createPostMutation.mutate(data)
  }

  return (
    <nav className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen p-4 hidden lg:block">
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <IconComponent icon={item.icon} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
        
        {/* Create Post Button */}
        <Button
          onClick={() => setIsCreatePostModalOpen(true)}
          className="w-full mt-4"
          variant="primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Create Post Modal */}
      <Modal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        title="Create New Post"
      >
        <CreatePostForm
          onSubmit={handleCreatePost}
          onCancel={() => setIsCreatePostModalOpen(false)}
          isSubmitting={createPostMutation.isPending}
        />
      </Modal>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <IconComponent icon={item.icon} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Mobile Create Post Button */}
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="flex flex-col items-center py-2 px-3 text-blue-600 dark:text-blue-400"
          >
            <PlusIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Create</span>
          </button>
        </div>
      </div>
    </nav>
  )
}