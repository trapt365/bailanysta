import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PostCard from '@/components/feed/PostCard'
import { Post, Comment } from '@/types/shared'

// Mock tRPC
const mockTrpc = {
  reactions: {
    hasUserReacted: {
      useQuery: vi.fn()
    }
  },
  comments: {
    listByPost: {
      useQuery: vi.fn()
    },
    create: {
      useMutation: vi.fn()
    }
  }
}

vi.mock('@/utils/trpc', () => ({
  trpc: mockTrpc
}))

// Mock validation utilities
vi.mock('@/utils/validation', () => ({
  validateCommentContent: vi.fn((content: string) => {
    const errors: string[] = []
    if (!content.trim()) errors.push('Comment cannot be empty')
    if (content.length > 140) errors.push('Comment cannot exceed 140 characters')
    return errors
  }),
  getCharacterCount: vi.fn((text: string) => text.length)
}))

const mockPost: Post = {
  id: 'test-post-1',
  content: 'This is a test post with some content',
  authorId: 'user-1',
  authorName: 'John Doe',
  createdAt: new Date('2024-01-01T12:00:00Z'),
  updatedAt: new Date('2024-01-01T12:00:00Z'),
  hashtags: [],
  reactionCount: 5,
  commentCount: 2
}

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'Great post!',
    postId: 'test-post-1',
    authorId: 'user-2',
    authorName: 'Jane Smith',
    createdAt: new Date('2024-01-01T12:30:00Z')
  },
  {
    id: 'comment-2',
    content: 'I agree with this',
    postId: 'test-post-1',
    authorId: 'user-3',
    authorName: 'Bob Johnson',
    createdAt: new Date('2024-01-01T12:45:00Z')
  }
]

describe('Comment Flow Integration', () => {
  let queryClient: QueryClient
  let mockMutate: ReturnType<typeof vi.fn>
  let mockRefetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockMutate = vi.fn()
    mockRefetch = vi.fn()

    // Setup mocks
    mockTrpc.reactions.hasUserReacted.useQuery.mockReturnValue({
      data: false,
      isLoading: false,
      error: null
    })

    mockTrpc.comments.listByPost.useQuery.mockReturnValue({
      data: mockComments,
      refetch: mockRefetch,
      isLoading: false,
      error: null
    })

    mockTrpc.comments.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null
    })
  })

  const renderPostCard = (post = mockPost, onUpdate?: (post: Post) => void) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PostCard post={post} onUpdate={onUpdate} />
      </QueryClientProvider>
    )
  }

  describe('Comment Toggle Functionality', () => {
    it('shows comment count in post actions', () => {
      renderPostCard()
      
      expect(screen.getByText('2')).toBeInTheDocument() // Comment count
    })

    it('toggles comment section visibility when comment button is clicked', async () => {
      renderPostCard()
      
      // Initially comments should not be visible
      expect(screen.queryByText('Great post!')).not.toBeInTheDocument()
      
      // Click comment button to show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      // Comments should now be visible
      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument()
        expect(screen.getByText('I agree with this')).toBeInTheDocument()
      })
      
      // Click again to hide comments
      fireEvent.click(commentButton)
      
      // Comments should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('Great post!')).not.toBeInTheDocument()
      })
    })

    it('highlights comment button when comments are shown', async () => {
      renderPostCard()
      
      const commentButton = screen.getByRole('button', { name: /2/ })
      
      // Initially not highlighted
      expect(commentButton).not.toHaveClass('text-blue-600')
      
      // Click to show comments
      fireEvent.click(commentButton)
      
      // Should be highlighted
      await waitFor(() => {
        expect(commentButton).toHaveClass('text-blue-600')
      })
    })
  })

  describe('Complete Comment Flow', () => {
    it('completes full comment creation flow', async () => {
      const newComment: Comment = {
        id: 'new-comment',
        content: 'This is my new comment',
        postId: 'test-post-1',
        authorId: 'mock-user-id',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({
          success: true,
          comment: newComment
        })
      })

      const onUpdate = vi.fn()
      renderPostCard(mockPost, onUpdate)
      
      // Click to show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      // Wait for comments to load
      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument()
      })
      
      // Type in comment input
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'This is my new comment' } })
      
      // Submit comment
      const submitButton = screen.getByText('Comment')
      fireEvent.click(submitButton)
      
      // Verify mutation was called
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          postId: 'test-post-1',
          content: 'This is my new comment'
        })
      })
      
      // Verify comment count was updated
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith({
          ...mockPost,
          commentCount: 3
        })
      })
      
      // Verify comments were refetched
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('handles comment character limit properly', async () => {
      renderPostCard()
      
      // Show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add comment...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      // Type content near limit
      const nearLimitContent = 'x'.repeat(125)
      fireEvent.change(textarea, { target: { value: nearLimitContent } })
      
      // Character counter should show warning
      expect(screen.getByText('125/140')).toHaveClass('text-yellow-500')
      
      // Submit button should be enabled
      const submitButton = screen.getByText('Comment')
      expect(submitButton).not.toBeDisabled()
      
      // Type content over limit
      const overLimitContent = 'x'.repeat(145)
      fireEvent.change(textarea, { target: { value: overLimitContent } })
      
      // Character counter should show error
      expect(screen.getByText('145/140')).toHaveClass('text-red-500')
      
      // Submit button should be disabled
      expect(submitButton).toBeDisabled()
    })

    it('shows empty state when no comments exist', async () => {
      mockTrpc.comments.listByPost.useQuery.mockReturnValue({
        data: [],
        refetch: mockRefetch,
        isLoading: false,
        error: null
      })

      const postWithoutComments = { ...mockPost, commentCount: 0 }
      renderPostCard(postWithoutComments)
      
      // Show comments
      const commentButton = screen.getByRole('button', { name: /0/ })
      fireEvent.click(commentButton)
      
      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument()
      })
    })

    it('displays existing comments in chronological order', async () => {
      renderPostCard()
      
      // Show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      // Wait for comments to load
      await waitFor(() => {
        expect(screen.getByText('Great post!')).toBeInTheDocument()
        expect(screen.getByText('I agree with this')).toBeInTheDocument()
      })
      
      // Verify order (chronological)
      const comments = screen.getAllByText(/Jane Smith|Bob Johnson/)
      expect(comments[0]).toHaveTextContent('Jane Smith') // Earlier comment
      expect(comments[1]).toHaveTextContent('Bob Johnson') // Later comment
    })

    it('clears input after successful comment submission', async () => {
      const newComment: Comment = {
        id: 'new-comment',
        content: 'Test comment',
        postId: 'test-post-1',
        authorId: 'mock-user-id',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({
          success: true,
          comment: newComment
        })
      })

      renderPostCard()
      
      // Show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add comment...')).toBeInTheDocument()
      })
      
      // Type and submit comment
      const textarea = screen.getByPlaceholderText('Add comment...') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      fireEvent.click(screen.getByText('Comment'))
      
      // Input should be cleared after successful submission
      await waitFor(() => {
        expect(textarea.value).toBe('')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles comment submission errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Network error'))
      })

      renderPostCard()
      
      // Show comments and submit
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add comment...')).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      fireEvent.click(screen.getByText('Comment'))
      
      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create comment:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('prevents empty comment submission', async () => {
      renderPostCard()
      
      // Show comments
      const commentButton = screen.getByRole('button', { name: /2/ })
      fireEvent.click(commentButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add comment...')).toBeInTheDocument()
      })
      
      // Try to submit empty comment
      const submitButton = screen.getByText('Comment')
      expect(submitButton).toBeDisabled()
      
      // Type whitespace only
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: '   ' } })
      
      // Submit should still be disabled
      expect(submitButton).toBeDisabled()
    })
  })
})