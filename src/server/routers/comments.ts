import { router, publicProcedure } from '../trpc'
import { createCommentSchema } from '@/utils/validation'
import { z } from 'zod'
import { commentService } from '../services/commentService'
import { TRPCError } from '@trpc/server'

export const commentsRouter = router({
  create: publicProcedure
    .input(createCommentSchema)
    .mutation(async ({ input }) => {
      try {
        // For MVP, we'll use a mock user ID and name
        // In a real app, this would come from authenticated session
        const mockUserId = 'mock-user-id'
        const mockUserName = 'Test User'
        
        const comment = await commentService.createComment(
          input.postId,
          input.content,
          mockUserId,
          mockUserName
        )

        return {
          success: true,
          comment
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create comment'
        })
      }
    }),

  listByPost: publicProcedure
    .input(z.object({
      postId: z.string().uuid('Invalid post ID format')
    }))
    .query(async ({ input }) => {
      try {
        const comments = await commentService.getCommentsByPostId(input.postId)
        return comments
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve comments'
        })
      }
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid('Invalid comment ID format')
    }))
    .mutation(async ({ input }) => {
      try {
        // For MVP, we'll use a mock user ID
        // In a real app, this would come from authenticated session
        const mockUserId = 'mock-user-id'
        
        const success = await commentService.deleteComment(input.id, mockUserId)

        return {
          success
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete comment'
        })
      }
    })
})