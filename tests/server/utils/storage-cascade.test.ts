import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { deletePost, createPost, createComment, toggleReaction, readData } from '@/server/utils/storage'
import { Post, Comment, Reaction, StorageData } from '@/types/shared'

// Mock file system operations
vi.mock('fs/promises')
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid')
}))

const mockFs = vi.mocked(fs)

// Mock data structure for testing
const createMockData = (): StorageData => ({
  version: 1,
  users: {
    'user-1': {
      id: 'user-1',
      username: 'Test User',
      email: 'test@example.com',
      joinedAt: new Date('2024-01-01'),
      postCount: 1,
      preferences: { theme: 'light', language: 'en' }
    }
  },
  posts: {
    'post-1': {
      id: 'post-1',
      content: 'Test post content',
      authorId: 'user-1',
      authorName: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      hashtags: ['test'],
      reactionCount: 2,
      commentCount: 1,
      mood: 'Happy'
    }
  },
  comments: {
    'comment-1': {
      id: 'comment-1',
      content: 'Test comment',
      postId: 'post-1',
      authorId: 'user-1',
      authorName: 'Test User',
      createdAt: new Date('2024-01-01')
    },
    'comment-2': {
      id: 'comment-2',
      content: 'Another comment',
      postId: 'post-1',
      authorId: 'user-1',
      authorName: 'Test User',
      createdAt: new Date('2024-01-01')
    },
    'comment-3': {
      id: 'comment-3',
      content: 'Comment on different post',
      postId: 'post-2',
      authorId: 'user-1',
      authorName: 'Test User',
      createdAt: new Date('2024-01-01')
    }
  },
  reactions: {
    'post-1_user-1': {
      id: 'reaction-1',
      type: 'heart',
      postId: 'post-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01')
    },
    'post-1_user-2': {
      id: 'reaction-2',
      type: 'heart',
      postId: 'post-1',
      userId: 'user-2',
      createdAt: new Date('2024-01-01')
    },
    'post-2_user-1': {
      id: 'reaction-3',
      type: 'heart',
      postId: 'post-2',
      userId: 'user-1',
      createdAt: new Date('2024-01-01')
    }
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    totalPosts: 1,
    totalUsers: 1
  }
})

describe('Storage Cascade Operations', () => {
  let mockData: StorageData

  beforeEach(() => {
    vi.clearAllMocks()
    mockData = createMockData()
    
    // Mock file reading to return our test data
    mockFs.readFile.mockResolvedValue(JSON.stringify(mockData))
    mockFs.writeFile.mockResolvedValue()
    mockFs.rename.mockResolvedValue()
    mockFs.access.mockResolvedValue()
    mockFs.copyFile.mockResolvedValue()
    mockFs.mkdir.mockResolvedValue('')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('deletePost cascade operations', () => {
    it('deletes post and all associated comments and reactions', async () => {
      const result = await deletePost('post-1')

      expect(result).toBe(true)
      expect(mockFs.writeFile).toHaveBeenCalled()

      // Get the data that was written
      const writeCall = mockFs.writeFile.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)

      // Post should be deleted
      expect(writtenData.posts['post-1']).toBeUndefined()

      // Associated comments should be deleted
      expect(writtenData.comments['comment-1']).toBeUndefined()
      expect(writtenData.comments['comment-2']).toBeUndefined()
      
      // Comments for other posts should remain
      expect(writtenData.comments['comment-3']).toBeDefined()

      // Associated reactions should be deleted
      expect(writtenData.reactions['post-1_user-1']).toBeUndefined()
      expect(writtenData.reactions['post-1_user-2']).toBeUndefined()
      
      // Reactions for other posts should remain
      expect(writtenData.reactions['post-2_user-1']).toBeDefined()
    })

    it('returns false when post does not exist', async () => {
      const result = await deletePost('nonexistent-post')

      expect(result).toBe(false)
      expect(mockFs.writeFile).not.toHaveBeenCalled()
    })

    it('handles posts with no comments or reactions', async () => {
      // Create data with a post that has no associated content
      const dataWithIsolatedPost = {
        ...mockData,
        posts: {
          ...mockData.posts,
          'isolated-post': {
            id: 'isolated-post',
            content: 'Isolated post',
            authorId: 'user-1',
            authorName: 'Test User',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            hashtags: [],
            reactionCount: 0,
            commentCount: 0
          }
        }
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(dataWithIsolatedPost))

      const result = await deletePost('isolated-post')

      expect(result).toBe(true)

      const writeCall = mockFs.writeFile.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)

      // Post should be deleted
      expect(writtenData.posts['isolated-post']).toBeUndefined()

      // Original comments and reactions should remain unchanged
      expect(Object.keys(writtenData.comments)).toHaveLength(3)
      expect(Object.keys(writtenData.reactions)).toHaveLength(3)
    })

    it('maintains data consistency after cascade deletion', async () => {
      await deletePost('post-1')

      const writeCall = mockFs.writeFile.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)

      // Verify metadata is updated
      expect(writtenData.metadata.lastUpdated).toBeDefined()
      expect(new Date(writtenData.metadata.lastUpdated)).toBeInstanceOf(Date)

      // Verify no orphaned references remain
      const remainingComments = Object.values(writtenData.comments)
      const remainingReactions = Object.values(writtenData.reactions)

      // No comments should reference the deleted post
      expect(remainingComments.some((c: any) => c.postId === 'post-1')).toBe(false)
      
      // No reactions should reference the deleted post
      expect(remainingReactions.some((r: any) => r.postId === 'post-1')).toBe(false)
    })

    it('handles deletion of multiple posts independently', async () => {
      // Add another post with its own comments/reactions
      const dataWithTwoPosts = {
        ...mockData,
        posts: {
          ...mockData.posts,
          'post-2': {
            id: 'post-2',
            content: 'Second post',
            authorId: 'user-1',
            authorName: 'Test User',
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
            hashtags: [],
            reactionCount: 1,
            commentCount: 1
          }
        }
      }

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(dataWithTwoPosts))

      // Delete first post
      await deletePost('post-1')

      let writeCall = mockFs.writeFile.mock.calls[0]
      let writtenData = JSON.parse(writeCall[1] as string)

      // Post-2 and its associations should still exist
      expect(writtenData.posts['post-2']).toBeDefined()
      expect(writtenData.comments['comment-3']).toBeDefined()
      expect(writtenData.reactions['post-2_user-1']).toBeDefined()

      // Post-1 and its associations should be gone
      expect(writtenData.posts['post-1']).toBeUndefined()
      expect(writtenData.comments['comment-1']).toBeUndefined()
      expect(writtenData.comments['comment-2']).toBeUndefined()
    })

    it('throws error when file operations fail', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'))

      await expect(deletePost('post-1')).rejects.toThrow('Failed to delete post')
    })

    it('creates backup before deletion', async () => {
      await deletePost('post-1')

      // Should attempt to create backup
      expect(mockFs.access).toHaveBeenCalled()
      expect(mockFs.copyFile).toHaveBeenCalled()
    })

    it('uses atomic file operations', async () => {
      await deletePost('post-1')

      // Should use temporary file for atomic write
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String)
      )
      expect(mockFs.rename).toHaveBeenCalled()
    })
  })

  describe('cascade deletion performance', () => {
    it('efficiently finds and removes associated data', async () => {
      // Create a larger dataset to test efficiency
      const largeDataset = { ...mockData }
      
      // Add many comments and reactions for different posts
      for (let i = 1; i <= 100; i++) {
        largeDataset.comments[`comment-${i}`] = {
          id: `comment-${i}`,
          content: `Comment ${i}`,
          postId: i <= 50 ? 'post-1' : 'post-other',
          authorId: 'user-1',
          authorName: 'Test User',
          createdAt: new Date()
        }
        
        largeDataset.reactions[`post-${i <= 50 ? '1' : 'other'}_user-${i}`] = {
          id: `reaction-${i}`,
          type: 'heart',
          postId: i <= 50 ? 'post-1' : 'post-other',
          userId: `user-${i}`,
          createdAt: new Date()
        }
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(largeDataset))

      const startTime = Date.now()
      await deletePost('post-1')
      const endTime = Date.now()

      // Should complete reasonably quickly (under 100ms for this dataset size)
      expect(endTime - startTime).toBeLessThan(100)

      const writeCall = mockFs.writeFile.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)

      // Should have removed exactly 50 comments and 50 reactions
      expect(Object.keys(writtenData.comments)).toHaveLength(50)
      expect(Object.keys(writtenData.reactions)).toHaveLength(50)
    })
  })
})