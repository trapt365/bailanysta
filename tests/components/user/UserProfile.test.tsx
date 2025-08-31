import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TRPCProvider } from '@trpc/react-query/dist/TRPCProvider'
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

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state initially', () => {
    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.getUserPosts.useQuery).mockReturnValue({
      data: [],
      isLoading: true,
      refetch: vi.fn()
    } as any)

    vi.mocked(trpc.users.updateProfile.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    } as any)

    render(<UserProfile />, { wrapper: createWrapper() })

    expect(screen.getByTestId('profile-loading') || document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('should display user profile information', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: 'Test User',
      bio: 'This is a test bio',
      joinedAt: new Date('2024-01-01'),
      postCount: 5,
    }

    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post content',
        authorId: 'test-user-id',
        authorName: 'Test User',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        hashtags: [],
        reactionCount: 2,
        commentCount: 1
      }
    ]

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
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('This is a test bio')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // Post count
      expect(screen.getByText('Posts')).toBeInTheDocument()
      expect(screen.getByText('Joined January 2024')).toBeInTheDocument()
    })
  })

  it('should display error state when profile fails to load', () => {
    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: null,
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

    expect(screen.getByText('Profile Not Found')).toBeInTheDocument()
    expect(screen.getByText('Unable to load the user profile. Please try again later.')).toBeInTheDocument()
  })

  it('should open edit profile modal when edit button is clicked', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: 'Test User',
      bio: 'This is a test bio',
      joinedAt: new Date('2024-01-01'),
      postCount: 5,
    }

    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: mockProfile,
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
      const editButton = screen.getByText('Edit Profile')
      expect(editButton).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Profile')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument() // Modal title
    })
  })

  it('should display user posts correctly', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: 'Test User',
      bio: 'This is a test bio',
      joinedAt: new Date('2024-01-01'),
      postCount: 1,
    }

    const mockPosts = [
      {
        id: 'post-1',
        content: 'This is a test post',
        authorId: 'test-user-id',
        authorName: 'Test User',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        hashtags: ['test'],
        reactionCount: 0,
        commentCount: 0
      }
    ]

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
      expect(screen.getByText('Posts (1)')).toBeInTheDocument()
      expect(screen.getByText('This is a test post')).toBeInTheDocument()
    })
  })

  it('should display empty state when user has no posts', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: 'Test User',
      bio: 'This is a test bio',
      joinedAt: new Date('2024-01-01'),
      postCount: 0,
    }

    vi.mocked(trpc.users.getProfile.useQuery).mockReturnValue({
      data: mockProfile,
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
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
      expect(screen.getByText('When this user posts something, it will appear here.')).toBeInTheDocument()
    })
  })
})