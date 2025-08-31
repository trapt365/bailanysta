import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { updateUserSchema, getUserPostsSchema } from '@/utils/validation'
import { UserService } from '../services/userService'

// Mock user for MVP - in real app this would come from auth
const MOCK_USER_ID = 'mock-user-id'

export const usersRouter = router({
  // Get current user's profile
  getProfile: publicProcedure
    .input(z.object({
      userId: z.string().uuid().optional()
    }).optional())
    .query(async ({ input }) => {
      try {
        const userId = input?.userId || MOCK_USER_ID
        const profile = await UserService.getUserProfile(userId)
        
        if (!profile) {
          // Create default user if not found
          const defaultUser = await UserService.createDefaultUser(userId, 'Test User')
          return {
            id: defaultUser.id,
            username: defaultUser.username,
            bio: defaultUser.bio,
            joinedAt: defaultUser.joinedAt,
            postCount: defaultUser.postCount,
          }
        }
        
        return profile
      } catch (error) {
        console.error('Error fetching user profile:', error)
        throw new Error('Failed to fetch user profile')
      }
    }),

  // Update user profile
  updateProfile: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      try {
        const updatedUser = await UserService.updateUser(MOCK_USER_ID, input)
        
        if (!updatedUser) {
          throw new Error('User not found')
        }
        
        return {
          success: true,
          user: updatedUser
        }
      } catch (error) {
        console.error('Error updating user profile:', error)
        throw new Error('Failed to update user profile')
      }
    }),

  // Get user's posts
  getUserPosts: publicProcedure
    .input(getUserPostsSchema)
    .query(async ({ input }) => {
      try {
        const posts = await UserService.getUserPosts(input)
        return posts
      } catch (error) {
        console.error('Error fetching user posts:', error)
        throw new Error('Failed to fetch user posts')
      }
    }),

  // Get profile by user ID
  getById: publicProcedure
    .input(z.object({
      userId: z.string().uuid()
    }))
    .query(async ({ input }) => {
      try {
        const profile = await UserService.getUserProfile(input.userId)
        if (!profile) {
          throw new Error('User not found')
        }
        return profile
      } catch (error) {
        console.error('Error fetching user by ID:', error)
        throw new Error('Failed to fetch user')
      }
    })
})