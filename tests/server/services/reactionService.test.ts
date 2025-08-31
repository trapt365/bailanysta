import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { ReactionService } from '@/server/services/reactionService'
import { storage } from '@/server/utils/storage'
import { Post, Reaction } from '@/types/shared'

// Mock the storage module
vi.mock('@/server/utils/storage', () => ({
  storage: {
    getPostById: vi.fn(),
    toggleReaction: vi.fn(),
    getUserReaction: vi.fn(),
    getPostReactions: vi.fn()
  }
}))

describe('ReactionService', () => {
  let reactionService: ReactionService
  let mockPost: Post
  let mockReaction: Reaction

  beforeEach(() => {
    reactionService = new ReactionService()
    
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

    mockReaction = {
      id: 'reaction-id',
      type: 'heart',
      postId: 'test-post-id',
      userId: 'user-id',
      createdAt: new Date()
    }

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('toggleReaction', () => {
    it('should successfully toggle reaction when post exists', async () => {
      const expectedResult = { isLiked: true, reactionCount: 6 }
      
      vi.mocked(storage.getPostById).mockResolvedValue(mockPost)
      vi.mocked(storage.toggleReaction).mockResolvedValue(expectedResult)

      const result = await reactionService.toggleReaction('test-post-id', 'user-id')

      expect(storage.getPostById).toHaveBeenCalledWith('test-post-id')
      expect(storage.toggleReaction).toHaveBeenCalledWith('test-post-id', 'user-id')
      expect(result).toEqual(expectedResult)
    })

    it('should throw TRPCError when postId is missing', async () => {
      await expect(
        reactionService.toggleReaction('', 'user-id')
      ).rejects.toThrow(TRPCError)

      await expect(
        reactionService.toggleReaction('', 'user-id')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Post ID and User ID are required'
      })
    })

    it('should throw TRPCError when userId is missing', async () => {
      await expect(
        reactionService.toggleReaction('post-id', '')
      ).rejects.toThrow(TRPCError)

      await expect(
        reactionService.toggleReaction('post-id', '')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Post ID and User ID are required'
      })
    })

    it('should throw TRPCError when post does not exist', async () => {
      vi.mocked(storage.getPostById).mockResolvedValue(null)

      await expect(
        reactionService.toggleReaction('nonexistent-post', 'user-id')
      ).rejects.toThrow(TRPCError)

      await expect(
        reactionService.toggleReaction('nonexistent-post', 'user-id')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Post not found'
      })
    })

    it('should handle storage errors and map them to TRPCError', async () => {
      vi.mocked(storage.getPostById).mockResolvedValue(mockPost)
      
      const storageError = new Error('Storage error') as any
      storageError.code = 'STORAGE_VALIDATION_FAILED'
      vi.mocked(storage.toggleReaction).mockRejectedValue(storageError)

      await expect(
        reactionService.toggleReaction('test-post-id', 'user-id')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid reaction data'
      })
    })

    it('should handle POST_NOT_FOUND storage error', async () => {
      vi.mocked(storage.getPostById).mockResolvedValue(mockPost)
      
      const storageError = new Error('Post not found') as any
      storageError.code = 'POST_NOT_FOUND'
      vi.mocked(storage.toggleReaction).mockRejectedValue(storageError)

      await expect(
        reactionService.toggleReaction('test-post-id', 'user-id')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Post not found'
      })
    })

    it('should handle unexpected errors', async () => {
      vi.mocked(storage.getPostById).mockResolvedValue(mockPost)
      vi.mocked(storage.toggleReaction).mockRejectedValue(new Error('Unexpected error'))

      await expect(
        reactionService.toggleReaction('test-post-id', 'user-id')
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle reaction'
      })
    })

    it('should re-throw existing TRPCError', async () => {
      const trpcError = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authorized'
      })

      vi.mocked(storage.getPostById).mockRejectedValue(trpcError)

      await expect(
        reactionService.toggleReaction('test-post-id', 'user-id')
      ).rejects.toBe(trpcError)
    })
  })

  describe('getUserReaction', () => {
    it('should successfully get user reaction', async () => {
      vi.mocked(storage.getUserReaction).mockResolvedValue(mockReaction)

      const result = await reactionService.getUserReaction('test-post-id', 'user-id')

      expect(storage.getUserReaction).toHaveBeenCalledWith('test-post-id', 'user-id')
      expect(result).toEqual(mockReaction)
    })

    it('should return null when no reaction exists', async () => {
      vi.mocked(storage.getUserReaction).mockResolvedValue(null)

      const result = await reactionService.getUserReaction('test-post-id', 'user-id')

      expect(result).toBeNull()
    })

    it('should throw TRPCError when postId is missing', async () => {
      await expect(
        reactionService.getUserReaction('', 'user-id')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Post ID and User ID are required'
      })
    })

    it('should throw TRPCError when userId is missing', async () => {
      await expect(
        reactionService.getUserReaction('post-id', '')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Post ID and User ID are required'
      })
    })

    it('should handle storage errors', async () => {
      vi.mocked(storage.getUserReaction).mockRejectedValue(new Error('Storage error'))

      await expect(
        reactionService.getUserReaction('test-post-id', 'user-id')
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user reaction'
      })
    })
  })

  describe('getPostReactions', () => {
    it('should successfully get all post reactions', async () => {
      const mockReactions = [mockReaction]
      vi.mocked(storage.getPostReactions).mockResolvedValue(mockReactions)

      const result = await reactionService.getPostReactions('test-post-id')

      expect(storage.getPostReactions).toHaveBeenCalledWith('test-post-id')
      expect(result).toEqual(mockReactions)
    })

    it('should return empty array when no reactions exist', async () => {
      vi.mocked(storage.getPostReactions).mockResolvedValue([])

      const result = await reactionService.getPostReactions('test-post-id')

      expect(result).toEqual([])
    })

    it('should throw TRPCError when postId is missing', async () => {
      await expect(
        reactionService.getPostReactions('')
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Post ID is required'
      })
    })

    it('should handle storage errors', async () => {
      vi.mocked(storage.getPostReactions).mockRejectedValue(new Error('Storage error'))

      await expect(
        reactionService.getPostReactions('test-post-id')
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve post reactions'
      })
    })
  })

  describe('hasUserReacted', () => {
    it('should return true when user has reacted', async () => {
      vi.mocked(storage.getUserReaction).mockResolvedValue(mockReaction)

      const result = await reactionService.hasUserReacted('test-post-id', 'user-id')

      expect(result).toBe(true)
    })

    it('should return false when user has not reacted', async () => {
      vi.mocked(storage.getUserReaction).mockResolvedValue(null)

      const result = await reactionService.hasUserReacted('test-post-id', 'user-id')

      expect(result).toBe(false)
    })

    it('should return false when there is an error retrieving reaction', async () => {
      vi.mocked(storage.getUserReaction).mockRejectedValue(new Error('Storage error'))

      const result = await reactionService.hasUserReacted('test-post-id', 'user-id')

      expect(result).toBe(false)
    })
  })
})