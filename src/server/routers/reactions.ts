import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { reactionToggleSchema } from '@/utils/validation'
import { reactionService } from '../services/reactionService'

export const reactionsRouter = router({
  /**
   * Toggle a user's reaction on a post
   * Requires postId in input and userId from context (future auth implementation)
   */
  toggle: publicProcedure
    .input(reactionToggleSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Replace with actual user authentication
      // For now, we'll simulate a user ID - in production this would come from JWT/session
      const userId = 'user-1' // This should come from authenticated context
      
      return await reactionService.toggleReaction(input.postId, userId)
    }),

  /**
   * Get a user's reaction for a specific post
   * Used to determine if user has already reacted
   */
  getUserReaction: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // TODO: Replace with actual user authentication  
      const userId = 'user-1' // This should come from authenticated context
      
      return await reactionService.getUserReaction(input.postId, userId)
    }),

  /**
   * Check if user has reacted to a post
   * Simplified boolean check for UI state
   */
  hasUserReacted: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // TODO: Replace with actual user authentication
      const userId = 'user-1' // This should come from authenticated context
      
      return await reactionService.hasUserReacted(input.postId, userId)
    }),

  /**
   * Get all reactions for a specific post
   * Useful for detailed reaction analytics
   */
  getPostReactions: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await reactionService.getPostReactions(input.postId)
    })
})

export type ReactionsRouter = typeof reactionsRouter