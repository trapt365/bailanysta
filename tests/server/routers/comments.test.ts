import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { commentsRouter } from '@/server/routers/comments'
import { Comment } from '@/types/shared'

// Mock comment service
const mockCommentService = {
  createComment: vi.fn(),
  getCommentsByPostId: vi.fn(),
  deleteComment: vi.fn()
}

vi.mock('@/server/services/commentService', () => ({
  commentService: mockCommentService
}))

// Helper to create a test caller
function createCaller() {
  return commentsRouter.createCaller({})
}

describe('Comments Router', () => {
  let caller: ReturnType<typeof createCaller>

  beforeEach(() => {
    vi.clearAllMocks()
    caller = createCaller()
  })

  describe('create', () => {
    it('creates a comment successfully', async () => {
      const mockComment: Comment = {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        authorId: 'mock-user-id',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockCommentService.createComment.mockResolvedValue(mockComment)

      const result = await caller.create({
        postId: 'post-1',
        content: 'Test comment'
      })

      expect(result).toEqual({
        success: true,
        comment: mockComment
      })

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        'post-1',
        'Test comment',
        'mock-user-id',
        'Test User'
      )
    })

    it('validates input schema - missing postId', async () => {
      await expect(
        caller.create({
          postId: '',
          content: 'Test comment'
        })
      ).rejects.toThrow()
    })

    it('validates input schema - empty content', async () => {
      await expect(
        caller.create({
          postId: 'post-1',
          content: ''
        })
      ).rejects.toThrow()
    })

    it('validates input schema - content too long', async () => {
      const longContent = 'x'.repeat(141)

      await expect(
        caller.create({
          postId: 'post-1',
          content: longContent
        })
      ).rejects.toThrow()
    })

    it('validates input schema - invalid postId format', async () => {
      await expect(
        caller.create({
          postId: 'invalid-uuid',
          content: 'Test comment'
        })
      ).rejects.toThrow()
    })

    it('trims whitespace from content', async () => {
      const mockComment: Comment = {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        authorId: 'mock-user-id',
        authorName: 'Test User',
        createdAt: new Date()
      }

      mockCommentService.createComment.mockResolvedValue(mockComment)

      await caller.create({
        postId: 'post-1',
        content: '  Test comment  '
      })

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        'post-1',
        'Test comment',
        'mock-user-id',
        'Test User'
      )
    })

    it('handles service errors', async () => {
      mockCommentService.createComment.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid input'
        })
      )

      await expect(
        caller.create({
          postId: 'post-1',
          content: 'Test comment'
        })
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input'
      }))
    })

    it('handles unexpected errors', async () => {
      mockCommentService.createComment.mockRejectedValue(
        new Error('Unexpected error')
      )

      await expect(
        caller.create({
          postId: 'post-1',
          content: 'Test comment'
        })
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create comment'
      }))
    })
  })

  describe('listByPost', () => {
    it('retrieves comments successfully', async () => {
      const mockComments: Comment[] = [
        {
          id: 'comment-1',
          content: 'First comment',
          postId: 'post-1',
          authorId: 'user-1',
          authorName: 'John Doe',
          createdAt: new Date('2024-01-01T12:00:00Z')
        },
        {
          id: 'comment-2',
          content: 'Second comment',
          postId: 'post-1',
          authorId: 'user-2',
          authorName: 'Jane Smith',
          createdAt: new Date('2024-01-01T12:30:00Z')
        }
      ]

      mockCommentService.getCommentsByPostId.mockResolvedValue(mockComments)

      const result = await caller.listByPost({ postId: 'post-1' })

      expect(result).toEqual(mockComments)
      expect(mockCommentService.getCommentsByPostId).toHaveBeenCalledWith('post-1')
    })

    it('validates input schema - invalid postId format', async () => {
      await expect(
        caller.listByPost({ postId: 'invalid-uuid' })
      ).rejects.toThrow()
    })

    it('handles service errors', async () => {
      mockCommentService.getCommentsByPostId.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid post ID'
        })
      )

      await expect(
        caller.listByPost({ postId: 'post-1' })
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid post ID'
      }))
    })

    it('handles unexpected errors', async () => {
      mockCommentService.getCommentsByPostId.mockRejectedValue(
        new Error('Unexpected error')
      )

      await expect(
        caller.listByPost({ postId: 'post-1' })
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve comments'
      }))
    })

    it('returns empty array when no comments exist', async () => {
      mockCommentService.getCommentsByPostId.mockResolvedValue([])

      const result = await caller.listByPost({ postId: 'post-1' })

      expect(result).toEqual([])
    })
  })

  describe('delete', () => {
    it('deletes comment successfully', async () => {
      mockCommentService.deleteComment.mockResolvedValue(true)

      const result = await caller.delete({ id: 'comment-1' })

      expect(result).toEqual({ success: true })
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(
        'comment-1',
        'mock-user-id'
      )
    })

    it('validates input schema - invalid comment ID format', async () => {
      await expect(
        caller.delete({ id: 'invalid-uuid' })
      ).rejects.toThrow()
    })

    it('handles service errors', async () => {
      mockCommentService.deleteComment.mockRejectedValue(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found'
        })
      )

      await expect(
        caller.delete({ id: 'comment-1' })
      ).rejects.toThrow(new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found'
      }))
    })

    it('handles unexpected errors', async () => {
      mockCommentService.deleteComment.mockRejectedValue(
        new Error('Unexpected error')
      )

      await expect(
        caller.delete({ id: 'comment-1' })
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete comment'
      }))
    })
  })
})