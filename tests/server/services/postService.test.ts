import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostService } from '@/server/services/postService'
import { TRPCError } from '@trpc/server'
import { Post } from '@/types/shared'

// Mock the storage functions
vi.mock('@/server/utils/storage', () => ({
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  getUserPosts: vi.fn()
}))

// Mock validation functions
vi.mock('@/utils/validation', () => ({
  extractHashtags: vi.fn().mockReturnValue(['test', 'hashtag'])
}))

import { getPostById, updatePost, deletePost, getUserPosts } from '@/server/utils/storage'
import { extractHashtags } from '@/utils/validation'

const mockGetPostById = vi.mocked(getPostById)
const mockUpdatePost = vi.mocked(updatePost)
const mockDeletePost = vi.mocked(deletePost)
const mockGetUserPosts = vi.mocked(getUserPosts)
const mockExtractHashtags = vi.mocked(extractHashtags)

const mockPost: Post = {
  id: 'post-1',
  content: 'Original content',
  authorId: 'user-1',
  authorName: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  mood: 'Happy',
  hashtags: ['original'],
  reactionCount: 5,
  commentCount: 3
}

describe('PostService', () => {
  let postService: PostService

  beforeEach(() => {
    postService = new PostService()
    vi.clearAllMocks()
  })

  describe('updatePost', () => {
    it('successfully updates a post when user is the author', async () => {
      const updatedPost = { ...mockPost, content: 'Updated content', updatedAt: new Date() }
      
      mockGetPostById.mockResolvedValue(mockPost)
      mockUpdatePost.mockResolvedValue(updatedPost)

      const result = await postService.updatePost(
        'post-1',
        { content: 'Updated content' },
        'user-1'
      )

      expect(mockGetPostById).toHaveBeenCalledWith('post-1')
      expect(mockExtractHashtags).toHaveBeenCalledWith('Updated content')
      expect(mockUpdatePost).toHaveBeenCalledWith('post-1', {
        content: 'Updated content',
        hashtags: ['test', 'hashtag']
      })
      expect(result).toEqual(updatedPost)
    })

    it('throws NOT_FOUND error when post does not exist', async () => {
      mockGetPostById.mockResolvedValue(null)

      await expect(
        postService.updatePost('nonexistent-post', { content: 'Updated' }, 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.updatePost('nonexistent-post', { content: 'Updated' }, 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Post not found')
    })

    it('throws FORBIDDEN error when user is not the author', async () => {
      mockGetPostById.mockResolvedValue(mockPost)

      await expect(
        postService.updatePost('post-1', { content: 'Updated' }, 'different-user')
      ).rejects.toThrow(TRPCError)

      const error = await postService.updatePost('post-1', { content: 'Updated' }, 'different-user')
        .catch(e => e)
      
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('You can only edit your own posts')
    })

    it('throws INTERNAL_SERVER_ERROR when update fails', async () => {
      mockGetPostById.mockResolvedValue(mockPost)
      mockUpdatePost.mockResolvedValue(null)

      await expect(
        postService.updatePost('post-1', { content: 'Updated' }, 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.updatePost('post-1', { content: 'Updated' }, 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.message).toBe('Failed to update post')
    })

    it('handles updates without content changes', async () => {
      const updatedPost = { ...mockPost, mood: 'Excited' as const, updatedAt: new Date() }
      
      mockGetPostById.mockResolvedValue(mockPost)
      mockUpdatePost.mockResolvedValue(updatedPost)

      const result = await postService.updatePost(
        'post-1',
        { mood: 'Excited' },
        'user-1'
      )

      // Should not call extractHashtags when content is not updated
      expect(mockExtractHashtags).not.toHaveBeenCalled()
      expect(mockUpdatePost).toHaveBeenCalledWith('post-1', { mood: 'Excited' })
      expect(result).toEqual(updatedPost)
    })

    it('handles storage layer errors gracefully', async () => {
      mockGetPostById.mockRejectedValue(new Error('Storage error'))

      await expect(
        postService.updatePost('post-1', { content: 'Updated' }, 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.updatePost('post-1', { content: 'Updated' }, 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.message).toBe('An unexpected error occurred while updating the post')
    })
  })

  describe('deletePost', () => {
    it('successfully deletes a post when user is the author', async () => {
      mockGetPostById.mockResolvedValue(mockPost)
      mockDeletePost.mockResolvedValue(true)

      await postService.deletePost('post-1', 'user-1')

      expect(mockGetPostById).toHaveBeenCalledWith('post-1')
      expect(mockDeletePost).toHaveBeenCalledWith('post-1')
    })

    it('throws NOT_FOUND error when post does not exist', async () => {
      mockGetPostById.mockResolvedValue(null)

      await expect(
        postService.deletePost('nonexistent-post', 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.deletePost('nonexistent-post', 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Post not found')
    })

    it('throws FORBIDDEN error when user is not the author', async () => {
      mockGetPostById.mockResolvedValue(mockPost)

      await expect(
        postService.deletePost('post-1', 'different-user')
      ).rejects.toThrow(TRPCError)

      const error = await postService.deletePost('post-1', 'different-user')
        .catch(e => e)
      
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('You can only delete your own posts')
    })

    it('throws INTERNAL_SERVER_ERROR when deletion fails', async () => {
      mockGetPostById.mockResolvedValue(mockPost)
      mockDeletePost.mockResolvedValue(false)

      await expect(
        postService.deletePost('post-1', 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.deletePost('post-1', 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.message).toBe('Failed to delete post')
    })

    it('handles storage layer errors gracefully', async () => {
      mockGetPostById.mockRejectedValue(new Error('Storage error'))

      await expect(
        postService.deletePost('post-1', 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.deletePost('post-1', 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.message).toBe('An unexpected error occurred while deleting the post')
    })
  })

  describe('getUserPostsWithOwnership', () => {
    const mockUserPosts = [
      { ...mockPost, id: 'post-1', authorId: 'user-1' },
      { ...mockPost, id: 'post-2', authorId: 'user-2' },
      { ...mockPost, id: 'post-3', authorId: 'user-1' }
    ]

    it('returns posts with correct ownership flags', async () => {
      mockGetUserPosts.mockResolvedValue(mockUserPosts)

      const result = await postService.getUserPostsWithOwnership(
        'user-1',
        'user-1',
        { limit: 20, offset: 0 }
      )

      expect(result).toEqual([
        { ...mockUserPosts[0], isOwner: true },
        { ...mockUserPosts[1], isOwner: false },
        { ...mockUserPosts[2], isOwner: true }
      ])
    })

    it('marks all posts as not owned when current user is different', async () => {
      mockGetUserPosts.mockResolvedValue(mockUserPosts)

      const result = await postService.getUserPostsWithOwnership(
        'user-1',
        'different-user'
      )

      expect(result.every(post => post.isOwner === false)).toBe(true)
    })

    it('handles empty post list', async () => {
      mockGetUserPosts.mockResolvedValue([])

      const result = await postService.getUserPostsWithOwnership('user-1', 'user-1')

      expect(result).toEqual([])
    })

    it('handles storage layer errors gracefully', async () => {
      mockGetUserPosts.mockRejectedValue(new Error('Storage error'))

      await expect(
        postService.getUserPostsWithOwnership('user-1', 'user-1')
      ).rejects.toThrow(TRPCError)

      const error = await postService.getUserPostsWithOwnership('user-1', 'user-1')
        .catch(e => e)
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.message).toBe('Failed to fetch user posts')
    })
  })
})