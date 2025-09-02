import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { createPostSchema, updatePostSchema, deletePostSchema } from '@/utils/validation'
import { createPost, getPosts, getPostById, getPostsByHashtag } from '../utils/storage'
import { postService } from '../services/postService'

// Mock user for MVP - in real app this would come from auth
const MOCK_USER = {
  id: 'mock-user-id',
  name: 'Test User'
}

export const postsRouter = router({
  // Create a new post
  create: publicProcedure
    .input(createPostSchema)
    .mutation(async ({ input }) => {
      try {
        const post = await createPost(
          input.content,
          MOCK_USER.id,
          MOCK_USER.name,
          input.mood
        )
        
        return {
          success: true,
          post
        }
      } catch (error) {
        console.error('Error creating post:', error)
        throw new Error('Failed to create post')
      }
    }),

  // Get all posts
  getAll: publicProcedure
    .query(async () => {
      try {
        const posts = await getPosts()
        return posts
      } catch (error) {
        console.error('Error fetching posts:', error)
        throw new Error('Failed to fetch posts')
      }
    }),

  // Get posts with pagination
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0)
    }))
    .query(async ({ input }) => {
      try {
        const posts = await getPosts({
          limit: input.limit,
          offset: input.offset,
          sortBy: 'createdAt'
        })
        return posts
      } catch (error) {
        console.error('Error fetching posts:', error)
        throw new Error('Failed to fetch posts')
      }
    }),

  // Get post by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const post = await getPostById(input.id)
        if (!post) {
          throw new Error('Post not found')
        }
        return post
      } catch (error) {
        console.error('Error fetching post:', error)
        throw new Error('Failed to fetch post')
      }
    }),

  // Get posts by hashtag
  getByHashtag: publicProcedure
    .input(z.object({
      hashtag: z.string().min(1, 'Hashtag cannot be empty'),
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0)
    }))
    .query(async ({ input }) => {
      try {
        const posts = await getPostsByHashtag(input.hashtag, {
          limit: input.limit,
          offset: input.offset,
          sortBy: 'createdAt'
        })
        return posts
      } catch (error) {
        console.error('Error fetching posts by hashtag:', error)
        throw new Error('Failed to fetch posts by hashtag')
      }
    }),

  // Update a post (requires ownership)
  update: publicProcedure
    .input(updatePostSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, content, mood } = input
        const updatedPost = await postService.updatePost(
          id,
          { content, mood },
          MOCK_USER.id // In real app, this would come from authenticated user context
        )
        
        return {
          success: true,
          post: updatedPost
        }
      } catch (error: any) {
        console.error('Error updating post:', error)
        
        // Re-throw tRPC errors as-is
        if (error.code) {
          throw error
        }
        
        throw new Error('Failed to update post')
      }
    }),

  // Delete a post (requires ownership)
  delete: publicProcedure
    .input(deletePostSchema)
    .mutation(async ({ input }) => {
      try {
        await postService.deletePost(
          input.id,
          MOCK_USER.id // In real app, this would come from authenticated user context
        )
        
        return {
          success: true
        }
      } catch (error: any) {
        console.error('Error deleting post:', error)
        
        // Re-throw tRPC errors as-is
        if (error.code) {
          throw error
        }
        
        throw new Error('Failed to delete post')
      }
    })
})