import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { commentService } from '@/server/services/commentService'
import { Comment } from '@/types/shared'

// Mock storage
const mockStorage = {
  createComment: vi.fn(),
  getCommentsByPostId: vi.fn(),
  deleteComment: vi.fn()
}

vi.mock('@/server/utils/storage', () => ({
  storage: mockStorage
}))

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createComment', () => {
    it('creates a comment successfully', async () => {
      const mockComment: Comment = {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        authorId: 'user-1',
        authorName: 'John Doe',
        createdAt: new Date()
      }

      mockStorage.createComment.mockResolvedValue(mockComment)

      const result = await commentService.createComment(
        'post-1',
        'Test comment',
        'user-1',
        'John Doe'
      )

      expect(result).toEqual(mockComment)
      expect(mockStorage.createComment).toHaveBeenCalledWith(
        'post-1',
        'Test comment',
        'user-1',
        'John Doe'
      )
    })

    it('throws BAD_REQUEST when postId is missing', async () => {
      await expect(
        commentService.createComment('', 'Test comment', 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing required fields for comment creation'
      }))

      expect(mockStorage.createComment).not.toHaveBeenCalled()
    })

    it('throws BAD_REQUEST when content is empty', async () => {
      await expect(
        commentService.createComment('post-1', '   ', 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing required fields for comment creation'
      }))

      expect(mockStorage.createComment).not.toHaveBeenCalled()
    })

    it('throws BAD_REQUEST when authorId is missing', async () => {
      await expect(
        commentService.createComment('post-1', 'Test comment', '', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing required fields for comment creation'
      }))

      expect(mockStorage.createComment).not.toHaveBeenCalled()
    })

    it('throws BAD_REQUEST when authorName is missing', async () => {
      await expect(
        commentService.createComment('post-1', 'Test comment', 'user-1', '')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing required fields for comment creation'
      }))

      expect(mockStorage.createComment).not.toHaveBeenCalled()
    })

    it('throws BAD_REQUEST when content exceeds 140 characters', async () => {
      const longContent = 'x'.repeat(141)

      await expect(
        commentService.createComment('post-1', longContent, 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Comment cannot exceed 140 characters'
      }))

      expect(mockStorage.createComment).not.toHaveBeenCalled()
    })

    it('accepts content exactly at 140 characters', async () => {
      const maxContent = 'x'.repeat(140)
      const mockComment: Comment = {
        id: 'comment-1',
        content: maxContent,
        postId: 'post-1',
        authorId: 'user-1',
        authorName: 'John Doe',
        createdAt: new Date()
      }

      mockStorage.createComment.mockResolvedValue(mockComment)

      const result = await commentService.createComment(
        'post-1',
        maxContent,
        'user-1',
        'John Doe'
      )

      expect(result).toEqual(mockComment)
      expect(mockStorage.createComment).toHaveBeenCalledWith(
        'post-1',
        maxContent,
        'user-1',
        'John Doe'
      )
    })

    it('throws NOT_FOUND when post does not exist', async () => {
      const error = new Error('Post not found')
      ;(error as any).code = 'POST_NOT_FOUND'
      mockStorage.createComment.mockRejectedValue(error)

      await expect(
        commentService.createComment('nonexistent-post', 'Test comment', 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      }))
    })

    it('throws BAD_REQUEST for validation errors', async () => {
      const error = new Error('Validation failed')
      ;(error as any).code = 'STORAGE_VALIDATION_FAILED'
      mockStorage.createComment.mockRejectedValue(error)

      await expect(
        commentService.createComment('post-1', 'Test comment', 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid comment data'
      }))
    })

    it('throws INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      mockStorage.createComment.mockRejectedValue(new Error('Unexpected error'))

      await expect(
        commentService.createComment('post-1', 'Test comment', 'user-1', 'John Doe')
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create comment'
      }))
    })
  })

  describe('getCommentsByPostId', () => {
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

      mockStorage.getCommentsByPostId.mockResolvedValue(mockComments)

      const result = await commentService.getCommentsByPostId('post-1')

      expect(result).toEqual(mockComments)
      expect(mockStorage.getCommentsByPostId).toHaveBeenCalledWith('post-1')
    })

    it('throws BAD_REQUEST when postId is missing', async () => {
      await expect(
        commentService.getCommentsByPostId('')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Post ID is required'
      }))

      expect(mockStorage.getCommentsByPostId).not.toHaveBeenCalled()
    })

    it('returns empty array when no comments exist', async () => {
      mockStorage.getCommentsByPostId.mockResolvedValue([])

      const result = await commentService.getCommentsByPostId('post-1')

      expect(result).toEqual([])
    })

    it('throws INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      mockStorage.getCommentsByPostId.mockRejectedValue(new Error('Unexpected error'))

      await expect(
        commentService.getCommentsByPostId('post-1')
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve comments'
      }))
    })
  })

  describe('deleteComment', () => {
    it('deletes comment successfully', async () => {
      mockStorage.deleteComment.mockResolvedValue(true)

      const result = await commentService.deleteComment('comment-1', 'user-1')

      expect(result).toBe(true)
      expect(mockStorage.deleteComment).toHaveBeenCalledWith('comment-1')
    })

    it('throws BAD_REQUEST when commentId is missing', async () => {
      await expect(
        commentService.deleteComment('', 'user-1')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Comment ID and author ID are required'
      }))

      expect(mockStorage.deleteComment).not.toHaveBeenCalled()
    })

    it('throws BAD_REQUEST when authorId is missing', async () => {
      await expect(
        commentService.deleteComment('comment-1', '')
      ).rejects.toThrow(new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Comment ID and author ID are required'
      }))

      expect(mockStorage.deleteComment).not.toHaveBeenCalled()
    })

    it('throws NOT_FOUND when comment does not exist', async () => {
      mockStorage.deleteComment.mockResolvedValue(false)

      await expect(
        commentService.deleteComment('nonexistent-comment', 'user-1')
      ).rejects.toThrow(new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found'
      }))
    })

    it('throws INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      mockStorage.deleteComment.mockRejectedValue(new Error('Unexpected error'))

      await expect(
        commentService.deleteComment('comment-1', 'user-1')
      ).rejects.toThrow(new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete comment'
      }))
    })
  })
})