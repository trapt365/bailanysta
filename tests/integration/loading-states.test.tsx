import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TRPCProvider } from '@/utils/trpc'

import PostFeed from '@/components/feed/PostFeed'
import CreatePostForm from '@/components/forms/CreatePostForm'
import UserProfile from '@/components/user/UserProfile'

// Mock tRPC
const mockTrpc = {
  posts: {
    list: {
      useQuery: vi.fn()
    },
    create: {
      useMutation: vi.fn()
    }
  },
  users: {
    getProfile: {
      useQuery: vi.fn()
    },
    getUserPosts: {
      useQuery: vi.fn()
    },
    updateProfile: {
      useMutation: vi.fn()
    }
  },
  reactions: {
    hasUserReacted: {
      useQuery: vi.fn()
    }
  }
}

vi.mock('@/utils/trpc', () => ({
  trpc: mockTrpc,
  TRPCProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('Loading States Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TRPCProvider>
          {component}
        </TRPCProvider>
      </QueryClientProvider>
    )
  }

  describe('PostFeed Loading States', () => {
    it('shows skeleton loading while posts are loading', () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      renderWithProviders(<PostFeed />)

      // Should show skeleton loading components
      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getAllByRole('article')).toHaveLength(3) // 3 skeleton cards
    })

    it('shows posts after loading completes', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test post 1',
          authorName: 'John Doe',
          createdAt: new Date(),
          hashtags: [],
          commentCount: 0,
          reactionCount: 0
        },
        {
          id: '2',
          content: 'Test post 2',
          authorName: 'Jane Smith',
          createdAt: new Date(),
          hashtags: ['test'],
          commentCount: 1,
          reactionCount: 2
        }
      ]

      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: mockPosts,
        isLoading: false,
        error: null
      })

      mockTrpc.reactions.hasUserReacted.useQuery.mockReturnValue({
        data: false,
        isLoading: false,
        error: null
      })

      renderWithProviders(<PostFeed />)

      expect(screen.getByText('Test post 1')).toBeInTheDocument()
      expect(screen.getByText('Test post 2')).toBeInTheDocument()
    })

    it('shows error state when post loading fails', () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to load posts' }
      })

      renderWithProviders(<PostFeed />)

      expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument()
    })

    it('shows empty state when no posts exist', () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      })

      renderWithProviders(<PostFeed />)

      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText(/Be the first to share something/)).toBeInTheDocument()
    })

    it('handles fade-in animation on load', () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      const { container } = renderWithProviders(<PostFeed />)

      const loadingContainer = container.querySelector('.animate-fade-in')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('CreatePostForm Loading States', () => {
    it('shows loading button during form submission', async () => {
      const mockMutate = vi.fn()
      const mockOnSubmit = vi.fn().mockImplementation(() => new Promise(resolve => {
        setTimeout(resolve, 100)
      }))

      renderWithProviders(
        <CreatePostForm 
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /publishing/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.getByRole('status')).toBeInTheDocument() // Spinner in LoadingButton
    })

    it('enables submit button when not loading', () => {
      const mockOnSubmit = vi.fn()

      renderWithProviders(
        <CreatePostForm 
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      )

      const textarea = screen.getByPlaceholderText(/What's on your mind/i)
      fireEvent.change(textarea, { target: { value: 'Test post content' } })

      const submitButton = screen.getByRole('button', { name: /publish post/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('handles form submission with loading state transition', async () => {
      let isSubmitting = false
      const mockOnSubmit = vi.fn().mockImplementation(() => {
        isSubmitting = true
        return new Promise(resolve => {
          setTimeout(() => {
            isSubmitting = false
            resolve(undefined)
          }, 100)
        })
      })

      const { rerender } = renderWithProviders(
        <CreatePostForm 
          onSubmit={mockOnSubmit}
          isSubmitting={isSubmitting}
        />
      )

      const textarea = screen.getByPlaceholderText(/What's on your mind/i)
      fireEvent.change(textarea, { target: { value: 'Test post content' } })

      const submitButton = screen.getByRole('button', { name: /publish post/i })
      fireEvent.click(submitButton)

      // Simulate loading state
      rerender(
        <CreatePostForm 
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      )

      expect(screen.getByRole('button', { name: /publishing/i })).toBeDisabled()

      // Simulate completion
      await waitFor(() => {
        rerender(
          <CreatePostForm 
            onSubmit={mockOnSubmit}
            isSubmitting={false}
          />
        )
      })

      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: 'Test post content',
        mood: undefined
      })
    })
  })

  describe('UserProfile Loading States', () => {
    it('shows profile skeleton while loading', () => {
      mockTrpc.users.getProfile.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: vi.fn()
      })

      mockTrpc.users.getUserPosts.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn()
      })

      renderWithProviders(<UserProfile userId="test-user" />)

      // Should show the built-in skeleton in UserProfile
      expect(screen.getByText(/animate-pulse/i)).toBeInTheDocument()
    })

    it('shows profile data after loading', () => {
      const mockProfile = {
        id: 'test-user',
        username: 'Test User',
        bio: 'Test bio',
        joinedAt: new Date(),
        postCount: 5
      }

      mockTrpc.users.getProfile.useQuery.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        refetch: vi.fn()
      })

      mockTrpc.users.getUserPosts.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn()
      })

      renderWithProviders(<UserProfile userId="test-user" />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Test bio')).toBeInTheDocument()
      expect(screen.getByText(/5.*Posts/)).toBeInTheDocument()
    })

    it('shows error state when profile loading fails', () => {
      mockTrpc.users.getProfile.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        refetch: vi.fn()
      })

      mockTrpc.users.getUserPosts.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn()
      })

      renderWithProviders(<UserProfile userId="test-user" />)

      expect(screen.getByText('Profile Not Found')).toBeInTheDocument()
    })

    it('handles profile update loading state', async () => {
      const mockProfile = {
        id: 'test-user',
        username: 'Test User',
        bio: 'Test bio',
        joinedAt: new Date(),
        postCount: 5
      }

      const mockUpdateMutation = {
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        error: null
      }

      mockTrpc.users.getProfile.useQuery.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        refetch: vi.fn()
      })

      mockTrpc.users.getUserPosts.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn()
      })

      mockTrpc.users.updateProfile.useMutation.mockReturnValue(mockUpdateMutation)

      renderWithProviders(<UserProfile userId="test-user" />)

      const editButton = screen.getByText(/Edit Profile/i)
      fireEvent.click(editButton)

      // Should show modal with form in loading state
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State Animations', () => {
    it('applies fade-in animation to loading skeletons', () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      const { container } = renderWithProviders(<PostFeed />)

      const animatedContainer = container.querySelector('.animate-fade-in')
      expect(animatedContainer).toBeInTheDocument()
    })

    it('shows smooth transitions between loading and loaded states', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test post',
          authorName: 'John Doe',
          createdAt: new Date(),
          hashtags: [],
          commentCount: 0,
          reactionCount: 0
        }
      ]

      // Start with loading state
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      const { rerender } = renderWithProviders(<PostFeed />)

      // Verify loading state
      expect(screen.getAllByRole('article')).toHaveLength(3) // Skeletons

      // Switch to loaded state
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: mockPosts,
        isLoading: false,
        error: null
      })

      mockTrpc.reactions.hasUserReacted.useQuery.mockReturnValue({
        data: false,
        isLoading: false,
        error: null
      })

      rerender(<PostFeed />)

      // Verify loaded state
      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery', () => {
    it('shows retry functionality for failed operations', async () => {
      mockTrpc.posts.list.useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error' }
      })

      renderWithProviders(<PostFeed />)

      expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('handles loading state during retry operations', async () => {
      let isRetrying = false
      
      mockTrpc.posts.list.useQuery.mockImplementation(() => ({
        data: undefined,
        isLoading: isRetrying,
        error: isRetrying ? null : { message: 'Network error' },
        refetch: () => {
          isRetrying = true
          return Promise.resolve()
        }
      }))

      const { rerender } = renderWithProviders(<PostFeed />)

      // Initial error state
      expect(screen.getByText('Network error')).toBeInTheDocument()

      // Simulate retry
      isRetrying = true
      rerender(<PostFeed />)

      // Should show loading state during retry
      expect(screen.getAllByRole('article')).toHaveLength(3) // Back to skeletons
    })
  })
})