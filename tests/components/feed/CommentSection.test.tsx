import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import CommentSection from '@/components/feed/CommentSection'
import { Post, Comment } from '@/types/shared'

// Mock tRPC
const mockTrpc = createTRPCReact<any>()
vi.mock('@/utils/trpc', () => ({
  trpc: {
    comments: {
      listByPost: {
        useQuery: vi.fn()
      },
      create: {
        useMutation: vi.fn()
      }
    }
  }
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
  content: 'Test post content',
  authorId: 'user-1',
  authorName: 'John Doe',
  createdAt: new Date('2024-01-01T12:00:00Z'),
  updatedAt: new Date('2024-01-01T12:00:00Z'),
  hashtags: [],
  reactionCount: 0,
  commentCount: 0
}

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'This is a test comment',
    postId: 'test-post-1',
    authorId: 'user-2',
    authorName: 'Jane Smith',
    createdAt: new Date('2024-01-01T12:30:00Z')
  },
  {
    id: 'comment-2',
    content: 'Another test comment',
    postId: 'test-post-1',
    authorId: 'user-3',
    authorName: 'Bob Johnson',
    createdAt: new Date('2024-01-01T12:45:00Z')
  }
]

describe('CommentSection', () => {
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
    
    const { trpc } = require('@/utils/trpc')
    
    // Mock listByPost query
    trpc.comments.listByPost.useQuery.mockReturnValue({
      data: mockComments,
      refetch: mockRefetch,
      isLoading: false,
      error: null
    })
    
    // Mock create mutation
    trpc.comments.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null
    })
  })

  const renderCommentSection = (post = mockPost, onCommentAdded?: (comment: Comment) => void) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CommentSection post={post} onCommentAdded={onCommentAdded} />
      </QueryClientProvider>
    )
  }

  describe('Comment Display', () => {
    it('displays comments in chronological order', () => {
      renderCommentSection()
      
      const comments = screen.getAllByText(/test comment/)
      expect(comments).toHaveLength(2)
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
      expect(screen.getByText('Another test comment')).toBeInTheDocument()
    })

    it('shows author name and timestamp for each comment', () => {
      renderCommentSection()
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.getByText('30m')).toBeInTheDocument() // Relative time
      expect(screen.getByText('45m')).toBeInTheDocument()
    })

    it('displays empty state when no comments exist', () => {
      const { trpc } = require('@/utils/trpc')
      trpc.comments.listByPost.useQuery.mockReturnValue({
        data: [],
        refetch: mockRefetch,
        isLoading: false,
        error: null
      })
      
      renderCommentSection()
      
      expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument()
    })
  })

  describe('Comment Input', () => {
    it('renders comment input field with placeholder', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('rows', '2')
    })

    it('shows character counter', () => {
      renderCommentSection()
      
      expect(screen.getByText('0/140')).toBeInTheDocument()
    })

    it('updates character counter as user types', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      expect(screen.getByText('12/140')).toBeInTheDocument()
    })

    it('shows warning color when approaching character limit', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'x'.repeat(125) } })
      
      const counter = screen.getByText('125/140')
      expect(counter).toHaveClass('text-yellow-500')
    })

    it('shows error color when exceeding character limit', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'x'.repeat(145) } })
      
      const counter = screen.getByText('145/140')
      expect(counter).toHaveClass('text-red-500')
    })

    it('disables submit button when input is empty', () => {
      renderCommentSection()
      
      const submitButton = screen.getByText('Comment')
      expect(submitButton).toBeDisabled()
    })

    it('disables submit button when exceeding character limit', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'x'.repeat(145) } })
      
      const submitButton = screen.getByText('Comment')
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when input is valid', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'Valid comment' } })
      
      const submitButton = screen.getByText('Comment')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Comment Submission', () => {
    it('submits comment when form is submitted', async () => {
      const mockComment: Comment = {
        id: 'new-comment',
        content: 'New test comment',
        postId: 'test-post-1',
        authorId: 'user-1',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockMutate.mockImplementation(({ postId, content }, options) => {
        options.onSuccess({
          success: true,
          comment: mockComment
        })
      })

      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      const submitButton = screen.getByText('Comment')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          postId: 'test-post-1',
          content: 'New test comment'
        })
      })
    })

    it('submits comment when Enter key is pressed', async () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          postId: 'test-post-1',
          content: 'New test comment'
        })
      })
    })

    it('does not submit when Shift+Enter is pressed', () => {
      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', shiftKey: true })

      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('clears input after successful submission', async () => {
      const mockComment: Comment = {
        id: 'new-comment',
        content: 'New test comment',
        postId: 'test-post-1',
        authorId: 'user-1',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({
          success: true,
          comment: mockComment
        })
      })

      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...') as HTMLTextAreaElement
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.click(screen.getByText('Comment'))

      await waitFor(() => {
        expect(textarea.value).toBe('')
      })
    })

    it('calls onCommentAdded callback after successful submission', async () => {
      const mockComment: Comment = {
        id: 'new-comment',
        content: 'New test comment',
        postId: 'test-post-1',
        authorId: 'user-1',
        authorName: 'Test User',
        createdAt: new Date()
      }

      const onCommentAdded = vi.fn()

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({
          success: true,
          comment: mockComment
        })
      })

      renderCommentSection(mockPost, onCommentAdded)
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.click(screen.getByText('Comment'))

      await waitFor(() => {
        expect(onCommentAdded).toHaveBeenCalledWith(mockComment)
      })
    })

    it('refetches comments after successful submission', async () => {
      const mockComment: Comment = {
        id: 'new-comment',
        content: 'New test comment',
        postId: 'test-post-1',
        authorId: 'user-1',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({
          success: true,
          comment: mockComment
        })
      })

      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.click(screen.getByText('Comment'))

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    it('shows loading state during submission', async () => {
      const { trpc } = require('@/utils/trpc')
      trpc.comments.create.useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: true,
        error: null
      })

      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      
      expect(screen.getByText('Posting...')).toBeInTheDocument()
      expect(textarea).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('handles submission errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Network error'))
      })

      renderCommentSection()
      
      const textarea = screen.getByPlaceholderText('Add comment...')
      
      fireEvent.change(textarea, { target: { value: 'New test comment' } })
      fireEvent.click(screen.getByText('Comment'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create comment:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})