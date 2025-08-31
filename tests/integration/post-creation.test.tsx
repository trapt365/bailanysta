import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navigation from '@/components/layout/Navigation'

// Mock tRPC client
const mockMutate = vi.fn()
const mockUseMutation = vi.fn(() => ({
  mutate: mockMutate,
  isPending: false,
  isError: false,
  error: null,
}))

vi.mock('@/utils/trpc', () => ({
  trpc: {
    posts: {
      create: {
        useMutation: mockUseMutation,
      },
    },
  },
}))

// Mock Zustand store
const mockAddOptimisticPost = vi.fn()
const mockRemoveOptimisticPost = vi.fn()

vi.mock('@/stores/postsStore', () => ({
  usePostsStore: () => ({
    addOptimisticPost: mockAddOptimisticPost,
    removeOptimisticPost: mockRemoveOptimisticPost,
  }),
  createOptimisticPost: vi.fn((content, mood) => ({
    id: `optimistic-${content.slice(0, 10)}`,
    content,
    authorId: 'mock-user-id',
    authorName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    mood,
    hashtags: [],
    reactionCount: 0,
    commentCount: 0,
  })),
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Post Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full post creation workflow', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    )

    // 1. Click create post button
    const createButton = screen.getByRole('button', { name: /create post/i })
    await user.click(createButton)

    // 2. Modal should open
    expect(screen.getByText('Create New Post')).toBeInTheDocument()

    // 3. Fill out the form
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'This is my first post! #testing')

    const moodSelect = screen.getByRole('combobox')
    await user.selectOptions(moodSelect, 'Excited')

    // 4. Submit the form
    const publishButton = screen.getByRole('button', { name: /publish post/i })
    await user.click(publishButton)

    // 5. Verify optimistic update was called
    expect(mockAddOptimisticPost).toHaveBeenCalled()

    // 6. Verify tRPC mutation was called with correct data
    expect(mockMutate).toHaveBeenCalledWith({
      content: 'This is my first post! #testing',
      mood: 'Excited',
    })
  })

  it('handles form validation errors', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    )

    // Open modal
    const createButton = screen.getByRole('button', { name: /create post/i })
    await user.click(createButton)

    // Try to submit empty form
    const publishButton = screen.getByRole('button', { name: /publish post/i })
    expect(publishButton).toBeDisabled()

    // Add content that's too long
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const tooLongContent = 'a'.repeat(300)
    await user.type(textarea, tooLongContent)

    // Button should still be disabled
    expect(publishButton).toBeDisabled()
  })

  it('closes modal after successful submission', async () => {
    const user = userEvent.setup()
    
    // Mock successful mutation
    const mockOnSuccess = vi.fn()
    mockUseMutation.mockReturnValue({
      mutate: vi.fn((data) => mockOnSuccess()),
      isPending: false,
      isError: false,
      error: null,
    })

    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    )

    // Open modal and submit form
    const createButton = screen.getByRole('button', { name: /create post/i })
    await user.click(createButton)

    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'Valid post content')

    const publishButton = screen.getByRole('button', { name: /publish post/i })
    await user.click(publishButton)

    // Simulate successful submission
    mockOnSuccess()

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Create New Post')).not.toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock pending mutation
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    })

    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    )

    // Open modal
    const createButton = screen.getByRole('button', { name: /create post/i })
    await user.click(createButton)

    // Form should show loading state
    expect(screen.getByText(/publishing.../i)).toBeInTheDocument()
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    expect(textarea).toBeDisabled()
  })

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock error during mutation
    const mockOnError = vi.fn()
    mockUseMutation.mockReturnValue({
      mutate: vi.fn((data) => mockOnError(new Error('Network error'))),
      isPending: false,
      isError: true,
      error: new Error('Network error'),
    })

    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    )

    // Submit a post
    const createButton = screen.getByRole('button', { name: /create post/i })
    await user.click(createButton)

    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'Test post')

    const publishButton = screen.getByRole('button', { name: /publish post/i })
    await user.click(publishButton)

    // Simulate error
    mockOnError(new Error('Network error'))

    // Should remove optimistic post on error
    expect(mockRemoveOptimisticPost).toHaveBeenCalled()
  })
})