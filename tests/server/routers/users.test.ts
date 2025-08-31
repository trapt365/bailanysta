import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTRPCMsw } from 'msw-trpc'
import { UserService } from '@/server/services/userService'
import { usersRouter } from '@/server/routers/users'

// Mock UserService
vi.mock('@/server/services/userService', () => ({
  UserService: {
    getUserProfile: vi.fn(),
    updateUser: vi.fn(),
    getUserPosts: vi.fn(),
    createDefaultUser: vi.fn(),
  }
}))

describe('Users Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockProfile = {
        id: 'test-user-id',
        username: 'testuser',
        bio: 'Test bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 5,
      }

      vi.mocked(UserService.getUserProfile).mockResolvedValue(mockProfile)

      const caller = usersRouter.createCaller({})
      const result = await caller.getProfile({ userId: 'test-user-id' })

      expect(result).toEqual(mockProfile)
      expect(UserService.getUserProfile).toHaveBeenCalledWith('test-user-id')
    })

    it('should create default user when profile not found', async () => {
      const mockDefaultUser = {
        id: 'mock-user-id',
        username: 'Test User',
        email: undefined,
        bio: undefined,
        joinedAt: new Date('2024-01-01'),
        postCount: 0,
        preferences: {
          theme: 'system' as const,
          language: 'en' as const,
        }
      }

      vi.mocked(UserService.getUserProfile).mockResolvedValue(null)
      vi.mocked(UserService.createDefaultUser).mockResolvedValue(mockDefaultUser)

      const caller = usersRouter.createCaller({})
      const result = await caller.getProfile()

      expect(result).toEqual({
        id: 'mock-user-id',
        username: 'Test User',
        bio: undefined,
        joinedAt: new Date('2024-01-01'),
        postCount: 0,
      })
      expect(UserService.createDefaultUser).toHaveBeenCalledWith('mock-user-id', 'Test User')
    })
  })

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = {
        id: 'mock-user-id',
        username: 'Updated User',
        email: undefined,
        bio: 'Updated bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 0,
        preferences: {
          theme: 'system' as const,
          language: 'en' as const,
        }
      }

      vi.mocked(UserService.updateUser).mockResolvedValue(updatedUser)

      const caller = usersRouter.createCaller({})
      const result = await caller.updateProfile({
        username: 'Updated User',
        bio: 'Updated bio'
      })

      expect(result).toEqual({
        success: true,
        user: updatedUser
      })
      expect(UserService.updateUser).toHaveBeenCalledWith('mock-user-id', {
        username: 'Updated User',
        bio: 'Updated bio'
      })
    })

    it('should throw error when user not found', async () => {
      vi.mocked(UserService.updateUser).mockResolvedValue(null)

      const caller = usersRouter.createCaller({})
      
      await expect(caller.updateProfile({
        username: 'Updated User'
      })).rejects.toThrow('User not found')
    })
  })

  describe('getUserPosts', () => {
    it('should return user posts successfully', async () => {
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
        }
      ]

      vi.mocked(UserService.getUserPosts).mockResolvedValue(mockPosts)

      const caller = usersRouter.createCaller({})
      const result = await caller.getUserPosts({
        userId: 'test-user-id',
        limit: 20,
        offset: 0
      })

      expect(result).toEqual(mockPosts)
      expect(UserService.getUserPosts).toHaveBeenCalledWith({
        userId: 'test-user-id',
        limit: 20,
        offset: 0
      })
    })
  })

  describe('getById', () => {
    it('should return user profile by ID', async () => {
      const mockProfile = {
        id: 'test-user-id',
        username: 'testuser',
        bio: 'Test bio',
        joinedAt: new Date('2024-01-01'),
        postCount: 5,
      }

      vi.mocked(UserService.getUserProfile).mockResolvedValue(mockProfile)

      const caller = usersRouter.createCaller({})
      const result = await caller.getById({ userId: 'test-user-id' })

      expect(result).toEqual(mockProfile)
      expect(UserService.getUserProfile).toHaveBeenCalledWith('test-user-id')
    })

    it('should throw error when user not found', async () => {
      vi.mocked(UserService.getUserProfile).mockResolvedValue(null)

      const caller = usersRouter.createCaller({})
      
      await expect(caller.getById({ userId: 'nonexistent-user' }))
        .rejects.toThrow('User not found')
    })
  })
})