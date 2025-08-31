import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from '@/server/services/userService'
import { storage } from '@/server/utils/storage'

// Mock the storage module
vi.mock('@/server/utils/storage', () => ({
  storage: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    getUserPosts: vi.fn(),
    createUser: vi.fn(),
  }
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        bio: 'Test bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 5,
        preferences: {
          theme: 'light' as const,
          language: 'en' as const,
        }
      }

      vi.mocked(storage.getUserById).mockResolvedValue(mockUser)

      const result = await UserService.getUserProfile('test-user-id')

      expect(result).toEqual({
        id: 'test-user-id',
        username: 'testuser',
        bio: 'Test bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 5,
      })
      expect(storage.getUserById).toHaveBeenCalledWith('test-user-id')
    })

    it('should return null when user does not exist', async () => {
      vi.mocked(storage.getUserById).mockResolvedValue(null)

      const result = await UserService.getUserProfile('nonexistent-user')

      expect(result).toBeNull()
      expect(storage.getUserById).toHaveBeenCalledWith('nonexistent-user')
    })

    it('should throw TRPCError when storage fails', async () => {
      vi.mocked(storage.getUserById).mockRejectedValue(new Error('Storage error'))

      await expect(UserService.getUserProfile('test-user-id')).rejects.toThrow()
    })
  })

  describe('updateUser', () => {
    const mockExistingUser = {
      id: 'test-user-id',
      username: 'oldusername',
      email: 'test@example.com',
      bio: 'Old bio',
      joinedAt: new Date('2024-01-01'),
      postCount: 5,
      preferences: {
        theme: 'light' as const,
        language: 'en' as const,
      }
    }

    it('should update user successfully', async () => {
      const updates = {
        username: 'newusername',
        bio: 'New bio'
      }

      const updatedUser = {
        ...mockExistingUser,
        username: 'newusername',
        bio: 'New bio'
      }

      vi.mocked(storage.getUserById).mockResolvedValue(mockExistingUser)
      vi.mocked(storage.updateUser).mockResolvedValue(updatedUser)

      const result = await UserService.updateUser('test-user-id', updates)

      expect(result).toEqual(updatedUser)
      expect(storage.updateUser).toHaveBeenCalledWith('test-user-id', {
        username: 'newusername',
        bio: 'New bio',
        preferences: mockExistingUser.preferences
      })
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      vi.mocked(storage.getUserById).mockResolvedValue(null)

      await expect(UserService.updateUser('nonexistent-user', { username: 'test' }))
        .rejects.toThrow()
    })
  })

  describe('getUserPosts', () => {
    it('should return user posts successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        bio: 'Test bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 2,
        preferences: {
          theme: 'light' as const,
          language: 'en' as const,
        }
      }

      const mockPosts = [
        {
          id: 'post-1',
          content: 'Test post 1',
          authorId: 'test-user-id',
          authorName: 'testuser',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          hashtags: [],
          reactionCount: 0,
          commentCount: 0
        },
        {
          id: 'post-2',
          content: 'Test post 2',
          authorId: 'test-user-id',
          authorName: 'testuser',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          hashtags: [],
          reactionCount: 1,
          commentCount: 0
        }
      ]

      vi.mocked(storage.getUserById).mockResolvedValue(mockUser)
      vi.mocked(storage.getUserPosts).mockResolvedValue(mockPosts)

      const result = await UserService.getUserPosts({
        userId: 'test-user-id',
        limit: 20,
        offset: 0
      })

      expect(result).toEqual(mockPosts)
      expect(storage.getUserPosts).toHaveBeenCalledWith('test-user-id', {
        limit: 20,
        offset: 0
      })
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      vi.mocked(storage.getUserById).mockResolvedValue(null)

      await expect(UserService.getUserPosts({
        userId: 'nonexistent-user',
        limit: 20,
        offset: 0
      })).rejects.toThrow()
    })
  })
})