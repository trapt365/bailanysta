import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { createPostSchema } from '@/utils/validation'
import { createPost, getPosts, getPostById } from '../utils/storage'

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
    })
})