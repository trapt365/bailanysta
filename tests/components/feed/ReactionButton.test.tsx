import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactionButton from '@/components/feed/ReactionButton'
import { trpc } from '@/utils/trpc'
import { Post } from '@/types/shared'

// Mock tRPC
vi.mock('@/utils/trpc', () => ({
  trpc: {
    reactions: {
      toggle: {
        useMutation: vi.fn()
      }
    }
  }
}))

// Mock icons
vi.mock('@/components/ui/icons', () => ({
  HeartIcon: ({ className }: { className?: string }) => (
    <div data-testid="heart-outline" className={className} />
  ),
  HeartIconSolid: ({ className }: { className?: string }) => (
    <div data-testid="heart-solid" className={className} />
  )
}))

describe('ReactionButton', () => {
  let mockPost: Post
  let mockOnUpdate: ReturnType<typeof vi.fn>
  let mockMutate: ReturnType<typeof vi.fn>
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockPost = {
      id: 'test-post-id',
      content: 'Test post content',
      authorId: 'author-id',
      authorName: 'Test Author',
      createdAt: new Date(),
      updatedAt: new Date(),
      hashtags: [],
      reactionCount: 5,
      commentCount: 0
    }

    mockOnUpdate = vi.fn()
    mockMutate = vi.fn()

    // Mock the tRPC mutation
    vi.mocked(trpc.reactions.toggle.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
      data: null,
      isSuccess: false,
      reset: vi.fn()
    } as any)
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should render with correct initial state', () => {
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByTestId('heart-outline')).toBeInTheDocument()
    expect(screen.queryByTestId('heart-solid')).not.toBeInTheDocument()
  })

  it('should render liked state when isLiked is true', () => {
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} isLiked={true} />
    )

    expect(screen.getByTestId('heart-solid')).toBeInTheDocument()
    expect(screen.queryByTestId('heart-outline')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('should have correct accessibility attributes', () => {
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Like this post')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('tabIndex', '0')
  })

  it('should handle click and trigger optimistic update', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} isLiked={false} />
    )

    const button = screen.getByRole('button')
    
    // Click the button
    await user.click(button)

    // Should immediately show optimistic update
    expect(screen.getByTestId('heart-solid')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument() // Count should increase
    
    // Should call the mutation
    expect(mockMutate).toHaveBeenCalledWith({ postId: 'test-post-id' })
  })

  it('should handle keyboard navigation (Space key)', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    const button = screen.getByRole('button')
    button.focus()

    // Press space key
    await user.keyboard(' ')

    expect(mockMutate).toHaveBeenCalledWith({ postId: 'test-post-id' })
  })

  it('should handle keyboard navigation (Enter key)', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    const button = screen.getByRole('button')
    button.focus()

    // Press enter key
    await user.keyboard('{Enter}')

    expect(mockMutate).toHaveBeenCalledWith({ postId: 'test-post-id' })
  })

  it('should prevent multiple rapid clicks when mutation is pending', async () => {
    const user = userEvent.setup()

    // Mock pending state
    vi.mocked(trpc.reactions.toggle.useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
      data: null,
      isSuccess: false,
      reset: vi.fn()
    } as any)
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    // Multiple clicks should not trigger mutation
    await user.click(button)
    await user.click(button)

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('should revert optimistic update on error', async () => {
    const mockError = new Error('Network error')
    
    // Mock the mutation to trigger error handling
    const mockMutateWithError = vi.fn().mockImplementation(() => {
      // Simulate error callback
      const errorCallback = vi.mocked(trpc.reactions.toggle.useMutation).mock.calls[0][0].onError
      if (errorCallback) {
        errorCallback(mockError, { postId: 'test-post-id' }, undefined)
      }
    })

    vi.mocked(trpc.reactions.toggle.useMutation).mockReturnValue({
      mutate: mockMutateWithError,
      isPending: false,
      isError: true,
      error: mockError,
      data: null,
      isSuccess: false,
      reset: vi.fn()
    } as any)

    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} isLiked={false} />
    )

    const button = screen.getByRole('button')
    
    // Click should optimistically update first
    await user.click(button)
    
    // Then revert on error
    await waitFor(() => {
      expect(screen.getByTestId('heart-outline')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // Should revert to original count
    })
  })

  it('should call onUpdate when mutation succeeds', async () => {
    const mockSuccessData = { isLiked: true, reactionCount: 6 }
    
    // Mock successful mutation
    const mockMutateWithSuccess = vi.fn().mockImplementation(() => {
      const successCallback = vi.mocked(trpc.reactions.toggle.useMutation).mock.calls[0][0].onSuccess
      if (successCallback) {
        successCallback(mockSuccessData, { postId: 'test-post-id' }, undefined)
      }
    })

    vi.mocked(trpc.reactions.toggle.useMutation).mockReturnValue({
      mutate: mockMutateWithSuccess,
      isPending: false,
      isError: false,
      error: null,
      data: mockSuccessData,
      isSuccess: true,
      reset: vi.fn()
    } as any)

    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    await user.click(screen.getByRole('button'))

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockPost,
      reactionCount: 6
    })
  })

  it('should toggle from liked to unliked state', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} isLiked={true} />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Unlike this post')
    
    await user.click(button)

    // Should show optimistic unlike state
    expect(screen.getByTestId('heart-outline')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument() // Count should decrease
  })

  it('should have proper CSS classes for styling', () => {
    renderWithProviders(
      <ReactionButton post={mockPost} onUpdate={mockOnUpdate} />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('flex', 'items-center', 'space-x-1', 'px-3', 'py-1', 'rounded-full')
    expect(button).toHaveClass('hover:bg-red-50', 'focus:bg-red-50')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-red-500')
  })
})