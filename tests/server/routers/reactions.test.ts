import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { appRouter } from '@/server/routers'
import { reactionService } from '@/server/services/reactionService'
import { Reaction } from '@/types/shared'

// Mock the reaction service
vi.mock('@/server/services/reactionService', () => ({
  reactionService: {
    toggleReaction: vi.fn(),
    getUserReaction: vi.fn(),
    hasUserReacted: vi.fn(),
    getPostReactions: vi.fn()
  }
}))

describe('reactions router', () => {
  const caller = appRouter.createCaller({} as any)
  let mockReaction: Reaction

  beforeEach(() => {
    mockReaction = {
      id: 'reaction-id',
      type: 'heart',
      postId: 'test-post-id',
      userId: 'user-1',
      createdAt: new Date()
    }

    vi.clearAllMocks()
  })

  describe('toggle', () => {
    it('should successfully toggle reaction', async () => {
      const mockResult = { isLiked: true, reactionCount: 6 }
      vi.mocked(reactionService.toggleReaction).mockResolvedValue(mockResult)

      const result = await caller.reactions.toggle({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(reactionService.toggleReaction).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'user-1' // Mock user ID from router
      )
      expect(result).toEqual(mockResult)
    })

    it('should validate UUID format for postId', async () => {
      await expect(
        caller.reactions.toggle({ postId: 'invalid-uuid' })
      ).rejects.toThrow()
    })

    it('should handle service errors', async () => {
      const serviceError = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      })
      vi.mocked(reactionService.toggleReaction).mockRejectedValue(serviceError)

      await expect(
        caller.reactions.toggle({ 
          postId: '123e4567-e89b-12d3-a456-426614174000' 
        })
      ).rejects.toThrow('Post not found')
    })

    it('should call service with hardcoded user ID (MVP)', async () => {
      const mockResult = { isLiked: false, reactionCount: 4 }
      vi.mocked(reactionService.toggleReaction).mockResolvedValue(mockResult)

      await caller.reactions.toggle({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      // Verify the service is called with the hardcoded user ID from the router
      expect(reactionService.toggleReaction).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'user-1'
      )
    })
  })

  describe('getUserReaction', () => {
    it('should successfully get user reaction', async () => {
      vi.mocked(reactionService.getUserReaction).mockResolvedValue(mockReaction)

      const result = await caller.reactions.getUserReaction({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(reactionService.getUserReaction).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'user-1'
      )
      expect(result).toEqual(mockReaction)
    })

    it('should return null when no reaction exists', async () => {
      vi.mocked(reactionService.getUserReaction).mockResolvedValue(null)

      const result = await caller.reactions.getUserReaction({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(result).toBeNull()
    })

    it('should validate UUID format for postId', async () => {
      await expect(
        caller.reactions.getUserReaction({ postId: 'invalid-uuid' })
      ).rejects.toThrow()
    })

    it('should handle service errors', async () => {
      const serviceError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user reaction'
      })
      vi.mocked(reactionService.getUserReaction).mockRejectedValue(serviceError)

      await expect(
        caller.reactions.getUserReaction({ 
          postId: '123e4567-e89b-12d3-a456-426614174000' 
        })
      ).rejects.toThrow('Failed to retrieve user reaction')
    })
  })

  describe('hasUserReacted', () => {
    it('should return true when user has reacted', async () => {
      vi.mocked(reactionService.hasUserReacted).mockResolvedValue(true)

      const result = await caller.reactions.hasUserReacted({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(reactionService.hasUserReacted).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'user-1'
      )
      expect(result).toBe(true)
    })

    it('should return false when user has not reacted', async () => {
      vi.mocked(reactionService.hasUserReacted).mockResolvedValue(false)

      const result = await caller.reactions.hasUserReacted({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(result).toBe(false)
    })

    it('should validate UUID format for postId', async () => {
      await expect(
        caller.reactions.hasUserReacted({ postId: 'invalid-uuid' })
      ).rejects.toThrow()
    })
  })

  describe('getPostReactions', () => {
    it('should successfully get all post reactions', async () => {
      const mockReactions = [mockReaction]
      vi.mocked(reactionService.getPostReactions).mockResolvedValue(mockReactions)

      const result = await caller.reactions.getPostReactions({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(reactionService.getPostReactions).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      )
      expect(result).toEqual(mockReactions)
    })

    it('should return empty array when no reactions exist', async () => {
      vi.mocked(reactionService.getPostReactions).mockResolvedValue([])

      const result = await caller.reactions.getPostReactions({ 
        postId: '123e4567-e89b-12d3-a456-426614174000' 
      })

      expect(result).toEqual([])
    })

    it('should validate UUID format for postId', async () => {
      await expect(
        caller.reactions.getPostReactions({ postId: 'invalid-uuid' })
      ).rejects.toThrow()
    })

    it('should handle service errors', async () => {
      const serviceError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve post reactions'
      })
      vi.mocked(reactionService.getPostReactions).mockRejectedValue(serviceError)

      await expect(
        caller.reactions.getPostReactions({ 
          postId: '123e4567-e89b-12d3-a456-426614174000' 
        })
      ).rejects.toThrow('Failed to retrieve post reactions')
    })
  })

  describe('input validation', () => {
    it('should accept valid UUID formats', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000'
      ]

      vi.mocked(reactionService.hasUserReacted).mockResolvedValue(false)

      for (const uuid of validUUIDs) {
        await expect(
          caller.reactions.hasUserReacted({ postId: uuid })
        ).resolves.toBe(false)
      }
    })

    it('should reject invalid UUID formats', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // too long
        '123e4567_e89b_12d3_a456_426614174000', // wrong separators
        ''
      ]

      for (const invalidUuid of invalidUUIDs) {
        await expect(
          caller.reactions.hasUserReacted({ postId: invalidUuid })
        ).rejects.toThrow()
      }
    })
  })
})