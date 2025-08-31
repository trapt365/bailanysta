import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { postsRouter } from '@/server/routers/posts'
import { AppRouter } from '@/server/routers'
import { Post } from '@/types/shared'
import { TRPCError } from '@trpc/server'

// Mock the dependencies
vi.mock('@/server/services/postService', () => ({
  postService: {
    updatePost: vi.fn(),
    deletePost: vi.fn()
  }
}))

vi.mock('@/server/utils/storage', () => ({
  createPost: vi.fn(),
  getPosts: vi.fn(),
  getPostById: vi.fn()
}))

import { postService } from '@/server/services/postService'

const mockPostService = vi.mocked(postService)

// Create a test context
const createMockContext = () => ({
  // Mock context properties if needed
})

type PostsInput = inferProcedureInput<AppRouter['posts']['update']>
type PostsOutput = inferProcedureOutput<AppRouter['posts']['update']>

const mockUpdatedPost: Post = {
  id: 'test-post-id',
  content: 'Updated content',
  authorId: 'mock-user-id',
  authorName: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  mood: 'Excited',
  hashtags: ['updated'],
  reactionCount: 5,
  commentCount: 3
}

describe('Posts Router - Management Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('update procedure', () => {
    it('successfully updates a post', async () => {
      mockPostService.updatePost.mockResolvedValue(mockUpdatedPost)

      const input: PostsInput = {
        id: 'test-post-id',
        content: 'Updated content',
        mood: 'Excited'
      }

      const caller = postsRouter.createCaller(createMockContext())
      const result = await caller.update(input)

      expect(mockPostService.updatePost).toHaveBeenCalledWith(
        'test-post-id',
        { content: 'Updated content', mood: 'Excited' },
        'mock-user-id'
      )

      expect(result).toEqual({
        success: true,
        post: mockUpdatedPost
      })
    })

    it('handles TRPCError from service layer', async () => {
      const tRPCError = new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only edit your own posts'
      })

      mockPostService.updatePost.mockRejectedValue(tRPCError)

      const input: PostsInput = {
        id: 'test-post-id',
        content: 'Updated content'
      }

      const caller = postsRouter.createCaller(createMockContext())

      await expect(caller.update(input)).rejects.toThrow(TRPCError)
    })

    it('handles generic errors from service layer', async () => {
      mockPostService.updatePost.mockRejectedValue(new Error('Generic error'))

      const input: PostsInput = {
        id: 'test-post-id',
        content: 'Updated content'
      }

      const caller = postsRouter.createCaller(createMockContext())

      await expect(caller.update(input)).rejects.toThrow('Failed to update post')
    })

    it('validates input schema', async () => {
      const caller = postsRouter.createCaller(createMockContext())

      // Test invalid UUID
      await expect(
        caller.update({
          id: 'invalid-id',
          content: 'Content'
        })
      ).rejects.toThrow()

      // Test empty content
      await expect(
        caller.update({
          id: 'valid-uuid-format-test-test-test',
          content: ''
        })
      ).rejects.toThrow()

      // Test content too long
      await expect(
        caller.update({
          id: 'valid-uuid-format-test-test-test',
          content: 'a'.repeat(281)
        })
      ).rejects.toThrow()

      // Test invalid mood
      await expect(
        caller.update({
          id: 'valid-uuid-format-test-test-test',
          content: 'Valid content',
          mood: 'InvalidMood' as any
        })
      ).rejects.toThrow()
    })

    it('updates post without mood', async () => {
      const postWithoutMood = { ...mockUpdatedPost, mood: undefined }
      mockPostService.updatePost.mockResolvedValue(postWithoutMood)

      const input: PostsInput = {
        id: 'test-post-id',
        content: 'Updated content'
      }

      const caller = postsRouter.createCaller(createMockContext())
      const result = await caller.update(input)

      expect(mockPostService.updatePost).toHaveBeenCalledWith(
        'test-post-id',
        { content: 'Updated content', mood: undefined },
        'mock-user-id'
      )

      expect(result).toEqual({
        success: true,
        post: postWithoutMood
      })
    })
  })

  describe('delete procedure', () => {
    it('successfully deletes a post', async () => {
      mockPostService.deletePost.mockResolvedValue(undefined)

      const input = { id: 'test-post-id' }

      const caller = postsRouter.createCaller(createMockContext())
      const result = await caller.delete(input)

      expect(mockPostService.deletePost).toHaveBeenCalledWith(
        'test-post-id',
        'mock-user-id'
      )

      expect(result).toEqual({
        success: true
      })
    })

    it('handles TRPCError from service layer', async () => {
      const tRPCError = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      })

      mockPostService.deletePost.mockRejectedValue(tRPCError)

      const input = { id: 'nonexistent-post-id' }

      const caller = postsRouter.createCaller(createMockContext())

      await expect(caller.delete(input)).rejects.toThrow(TRPCError)
    })

    it('handles generic errors from service layer', async () => {
      mockPostService.deletePost.mockRejectedValue(new Error('Generic error'))

      const input = { id: 'test-post-id' }

      const caller = postsRouter.createCaller(createMockContext())

      await expect(caller.delete(input)).rejects.toThrow('Failed to delete post')
    })

    it('validates input schema', async () => {
      const caller = postsRouter.createCaller(createMockContext())

      // Test invalid UUID
      await expect(
        caller.delete({ id: 'invalid-id' })
      ).rejects.toThrow()

      // Test missing id
      await expect(
        caller.delete({} as any)
      ).rejects.toThrow()
    })

    it('handles authorization errors', async () => {
      const authError = new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only delete your own posts'
      })

      mockPostService.deletePost.mockRejectedValue(authError)

      const input = { id: 'other-users-post-id' }

      const caller = postsRouter.createCaller(createMockContext())

      await expect(caller.delete(input)).rejects.toThrow(TRPCError)

      const error = await caller.delete(input).catch(e => e)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('You can only delete your own posts')
    })
  })

  describe('integration with existing endpoints', () => {
    it('maintains backward compatibility with existing create endpoint', async () => {
      // This test ensures that adding new endpoints doesn't break existing functionality
      const caller = postsRouter.createCaller(createMockContext())
      
      // The router should still have the create method
      expect(typeof caller.create).toBe('function')
      expect(typeof caller.getAll).toBe('function')
      expect(typeof caller.list).toBe('function')
      expect(typeof caller.getById).toBe('function')
    })

    it('has all required procedures', () => {
      const procedures = Object.keys(postsRouter._def.procedures)
      
      expect(procedures).toContain('create')
      expect(procedures).toContain('getAll') 
      expect(procedures).toContain('list')
      expect(procedures).toContain('getById')
      expect(procedures).toContain('update')
      expect(procedures).toContain('delete')
    })
  })
})