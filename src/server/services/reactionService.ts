import { TRPCError } from '@trpc/server'
import { Reaction, ReactionToggleOutput } from '@/types/shared'
import { storage } from '@/server/utils/storage'

export class ReactionService {
  /**
   * Toggle a user's reaction on a post
   * @param postId - The ID of the post to react to
   * @param userId - The ID of the user reacting
   * @returns Object with reaction state and updated count
   */
  async toggleReaction(postId: string, userId: string): Promise<ReactionToggleOutput> {
    try {
      // Validate inputs
      if (!postId || !userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Post ID and User ID are required'
        })
      }

      // Check if post exists
      const post = await storage.getPostById(postId)
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        })
      }

      // Toggle the reaction
      const result = await storage.toggleReaction(postId, userId)
      
      return {
        isLiked: result.isLiked,
        reactionCount: result.reactionCount
      }
    } catch (error) {
      // Re-throw TRPCError as-is
      if (error instanceof TRPCError) {
        throw error
      }

      // Handle storage errors
      if (error instanceof Error && 'code' in error) {
        const storageError = error as any
        
        switch (storageError.code) {
          case 'POST_NOT_FOUND':
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Post not found'
            })
          case 'STORAGE_VALIDATION_FAILED':
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid reaction data'
            })
          default:
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to toggle reaction'
            })
        }
      }

      // Handle unexpected errors
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      })
    }
  }

  /**
   * Get a user's reaction for a specific post
   * @param postId - The ID of the post
   * @param userId - The ID of the user
   * @returns The user's reaction or null if no reaction exists
   */
  async getUserReaction(postId: string, userId: string): Promise<Reaction | null> {
    try {
      if (!postId || !userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Post ID and User ID are required'
        })
      }

      return await storage.getUserReaction(postId, userId)
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user reaction'
      })
    }
  }

  /**
   * Get all reactions for a specific post
   * @param postId - The ID of the post
   * @returns Array of reactions for the post
   */
  async getPostReactions(postId: string): Promise<Reaction[]> {
    try {
      if (!postId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Post ID is required'
        })
      }

      return await storage.getPostReactions(postId)
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve post reactions'
      })
    }
  }

  /**
   * Check if a user has reacted to a post
   * @param postId - The ID of the post
   * @param userId - The ID of the user
   * @returns True if user has reacted, false otherwise
   */
  async hasUserReacted(postId: string, userId: string): Promise<boolean> {
    try {
      const reaction = await this.getUserReaction(postId, userId)
      return reaction !== null
    } catch (error) {
      // If there's an error retrieving the reaction, assume no reaction
      return false
    }
  }
}

// Export singleton instance
export const reactionService = new ReactionService()