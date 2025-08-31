import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UserProfile from '@/components/user/UserProfile'
import { trpc } from '@/utils/trpc'

// Mock tRPC
vi.mock('@/utils/trpc', () => ({
  trpc: {
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
    }
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('User Profile Integration', () => {
  const mockProfile = {
    id: 'test-user-id',
    username: 'Test User',
    bio: 'This is a test bio',
    joinedAt: new Date('2024-01-01'),
    postCount: 3,
  }

  const mockPosts = [
    {
      id: 'post-1',
      content: 'Latest post',
      authorId: 'test-user-id',
      authorName: 'Test User',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      hashtags: ['latest'],
      reactionCount: 2,
      commentCount: 1
    },
    {
      id: 'post-2',
      content: 'Middle post with #hashtag',
      authorId: 'test-user-id',
      authorName: 'Test User',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      hashtags: ['hashtag'],
      reactionCount: 0,
      commentCount: 0
    },
    {
      id: 'post-3',
      content: 'Oldest post',
      authorId: 'test-user-id',
      authorName: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      hashtags: [],
      reactionCount: 1,
      commentCount: 2
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display complete user profile with posts in correct order', async () => {
    const mockRefetch = vi.fn()
    const mockMutate = vi.fn()

    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: mockRefetch
    } as any)

    vi.mocked(trpc.users.getUserPosts.useQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      refetch: mockRefetch
    } as any)

    vi.mocked(trpc.users.updateProfile.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      onSuccess: vi.fn(),
      onError: vi.fn()
    } as any)

    render(<UserProfile />, { wrapper: createWrapper() })

    // Verify profile header information
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(screen.getByText('This is a test bio')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Post count
      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Joined January 2024')).toBeInTheDocument()
    })

    // Verify posts are displayed in reverse chronological order
    const postContents = screen.getAllByText(/post/)
    expect(postContents[0]).toHaveTextContent('Latest post')
    expect(postContents[1]).toHaveTextContent('Middle post with #hashtag') 
    expect(postContents[2]).toHaveTextContent('Oldest post')

    // Verify posts section header
    expect(screen.getByText('Posts (3)')).toBeInTheDocument()
  })

  it('should handle complete edit profile workflow', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    const mockMutate = vi.fn()
    const mockOnSuccess = vi.fn()

    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: mockRefetch
    } as any)

    vi.mocked(trpc.users.getUserPosts.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: mockRefetch
    } as any)

    vi.mocked(trpc.users.updateProfile.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      onSuccess: mockOnSuccess,
      onError: vi.fn()
    } as any)

    render(<UserProfile />, { wrapper: createWrapper() })

    // Wait for profile to load and click edit button
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Profile')
    await user.click(editButton)

    // Verify modal opened with form
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is a test bio')).toBeInTheDocument()
    })

    // Edit the form
    const usernameInput = screen.getByLabelText('Username')
    const bioTextarea = screen.getByLabelText('Bio')

    await user.clear(usernameInput)
    await user.type(usernameInput, 'Updated User')

    await user.clear(bioTextarea)
    await user.type(bioTextarea, 'Updated bio content')

    // Submit the form
    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)

    // Verify mutation was called with correct data
    expect(mockMutate).toHaveBeenCalledWith({
      username: 'Updated User',
      bio: 'Updated bio content'
    })
  })

  it('should handle empty posts state correctly', async () => {
    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: { ...mockProfile, postCount: 0 },
      isLoading: false,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.getUserPosts.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.updateProfile.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    } as any)

    render(<UserProfile />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Posts (0)')).toBeInTheDocument()
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText('When this user posts something, it will appear here.')).toBeInTheDocument()
    })
  })

  it('should handle responsive design elements', async () => {
    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.getUserPosts.useQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.updateProfile.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    } as any)

    render(<UserProfile />, { wrapper: createWrapper() })

    await waitFor(() => {
      const profileContainer = screen.getByText('Test User').closest('.max-w-4xl')
      expect(profileContainer).toHaveClass('mx-auto', 'p-4', 'lg:p-6')
    })

    // Verify responsive classes are present (this tests the component structure)
    const usernameElement = screen.getByText('Test User')
    expect(usernameElement.closest('h1')).toHaveClass('text-2xl', 'sm:text-3xl')
  })
})