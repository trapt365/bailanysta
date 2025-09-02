import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { searchService } from '../services/searchService'

/**
 * Search router providing full-text search capabilities
 * Supports searching across post content, hashtags, and usernames
 */
export const searchRouter = router({
  // Search posts with full-text search across content, hashtags, and usernames
  posts: publicProcedure
    .input(z.object({ 
      query: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
      limit: z.number().min(1).max(50).optional().default(20),
      offset: z.number().min(0).optional().default(0)
    }))
    .query(async ({ input }) => {
      return await searchService.searchPosts(input.query, input.limit, input.offset)
    }),

  // Get popular hashtags for search suggestions
  popularHashtags: publicProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(20).optional().default(10) 
    }))
    .query(async ({ input }) => {
      return await searchService.getPopularHashtags(input.limit)
    }),

  // Search suggestions based on partial input
  suggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(10).optional().default(5)
    }))
    .query(async ({ input }) => {
      return await searchService.getSearchSuggestions(input.query, input.limit)
    }),

  // Get recent searches (placeholder for future user-specific feature)
  recentSearches: publicProcedure
    .query(async () => {
      // Placeholder - in real app would fetch from user's search history
      return [
        { query: '#coding', timestamp: new Date() },
        { query: 'javascript', timestamp: new Date() },
        { query: '#react', timestamp: new Date() }
      ]
    })
})