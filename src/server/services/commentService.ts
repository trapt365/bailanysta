import { Comment } from '@/types/shared'
import { storage } from '../utils/storage'
import { TRPCError } from '@trpc/server'

export class CommentService {
  async createComment(
    postId: string,
    content: string,
    authorId: string,
    authorName: string
  ): Promise<Comment> {
    try {
      // Validate inputs
      if (!postId || !content.trim() || !authorId || !authorName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Missing required fields for comment creation'
        })
      }

      // Validate content length
      if (content.trim().length > 140) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Comment cannot exceed 140 characters'
        })
      }

      const comment = await storage.createComment(
        postId,
        content,
        authorId,
        authorName
      )

      return comment
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      if (error instanceof Error && 'code' in error) {
        if ((error as any).code === 'POST_NOT_FOUND') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found'
          })
        }

        if ((error as any).code === 'STORAGE_VALIDATION_FAILED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid comment data'
          })
        }
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create comment'
      })
    }
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    try {
      if (!postId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Post ID is required'
        })
      }

      const comments = await storage.getCommentsByPostId(postId)
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
  }

  async deleteComment(id: string, authorId: string): Promise<boolean> {
    try {
      if (!id || !authorId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Comment ID and author ID are required'
        })
      }

      // In a real app, we would verify that the authorId matches the comment author
      // For this MVP, we'll allow deletion
      const success = await storage.deleteComment(id)
      
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found'
        })
      }

      return true
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete comment'
      })
    }
  }
}

export const commentService = new CommentService()