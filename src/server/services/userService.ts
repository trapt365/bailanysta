import { User, UserProfile, UpdateUserInput, GetUserPostsInput, Post } from '@/types/shared'
import { storage } from '../utils/storage'
import { TRPCError } from '@trpc/server'

export class UserService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await storage.getUserById(userId)
      if (!user) {
        return null
      }

      return {
        id: user.id,
        username: user.username,
        bio: user.bio,
        joinedAt: user.joinedAt,
        postCount: user.postCount,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user profile',
        cause: error,
      })
    }
  }

  static async updateUser(userId: string, updates: UpdateUserInput): Promise<User | null> {
    try {
      const user = await storage.getUserById(userId)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const updatedUser = await storage.updateUser(userId, {
        username: updates.username,
        bio: updates.bio,
        preferences: updates.preferences ? {
          ...user.preferences,
          ...updates.preferences
        } : user.preferences,
      })

      return updatedUser
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user profile',
        cause: error,
      })
    }
  }

  static async getUserPosts(input: GetUserPostsInput): Promise<Post[]> {
    try {
      const user = await storage.getUserById(input.userId)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const posts = await storage.getUserPosts(input.userId, {
        limit: input.limit,
        offset: input.offset,
      })

      return posts
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user posts',
        cause: error,
      })
    }
  }

  static async createDefaultUser(id: string, username: string): Promise<User> {
    try {
      const user: User = {
        id,
        username,
        email: undefined,
        bio: undefined,
        joinedAt: new Date(),
        postCount: 0,
        preferences: {
          theme: 'system',
          language: 'en',
        },
      }

      const data = await storage.createUser(user.username, user.email || '')
      
      await storage.updateUser(data.id, {
        username: user.username,
        bio: user.bio,
        joinedAt: user.joinedAt,
        postCount: user.postCount,
        preferences: user.preferences,
      } as any)

      return user
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
        cause: error,
      })
    }
  }
}