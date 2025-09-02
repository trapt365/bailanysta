import { Post } from '@/types/shared'
import { loadData } from '../utils/storage'
import { TRPCError } from '@trpc/server'

/**
 * SearchService - Advanced search functionality with indexing and caching
 * Provides full-text search across post content, hashtags, and usernames
 */
export class SearchService {
  private searchCache = new Map<string, { results: Post[]; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  /**
   * Search posts with advanced ranking and relevance scoring
   */
  async searchPosts(query: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
      // Check cache first
      const cacheKey = `search:${query}:${limit}:${offset}`
      const cached = this.searchCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.results
      }

      const data = await loadData()
      const posts = Object.values(data.posts)
      
      // Normalize search query
      const normalizedQuery = query.toLowerCase().trim()
      const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0)
      
      if (queryWords.length === 0) {
        return []
      }
      
      // Search across content, hashtags, and usernames with advanced scoring
      const searchResults = posts
        .map(post => {
          let score = 0
          let matches: string[] = []
          
          // Content matching (highest weight)
          const contentLower = post.content.toLowerCase()
          let contentMatches = 0
          
          queryWords.forEach(word => {
            if (contentLower.includes(word)) {
              contentMatches++
              score += 10
              
              // Bonus for word boundaries
              if (new RegExp(`\\b${word}\\b`).test(contentLower)) {
                score += 5
              }
              
              // Bonus for starting with the word
              if (contentLower.startsWith(word)) {
                score += 8
              }
            }
          })
          
          if (contentMatches > 0) {
            matches.push('content')
            
            // Bonus for multiple word matches
            if (contentMatches > 1) {
              score += contentMatches * 3
            }
          }
          
          // Hashtag matching (medium weight)
          if (post.hashtags && post.hashtags.length > 0) {
            let hashtagMatches = 0
            
            post.hashtags.forEach(hashtag => {
              const hashtagLower = hashtag.toLowerCase()
              queryWords.forEach(word => {
                if (hashtagLower.includes(word)) {
                  hashtagMatches++
                  score += 7
                  
                  // Bonus for exact hashtag match
                  if (hashtagLower === word || hashtagLower === word.replace('#', '')) {
                    score += 10
                  }
                }
              })
            })
            
            if (hashtagMatches > 0) {
              matches.push('hashtags')
            }
          }
          
          // Author name matching (lower weight)
          const authorLower = post.authorName.toLowerCase()
          let authorMatches = 0
          
          queryWords.forEach(word => {
            if (authorLower.includes(word)) {
              authorMatches++
              score += 4
              
              // Bonus for exact author match
              if (authorLower === word) {
                score += 8
              }
            }
          })
          
          if (authorMatches > 0) {
            matches.push('author')
          }
          
          // Exact phrase matching bonus
          if (post.content.toLowerCase().includes(normalizedQuery)) {
            score += 20
          }
          
          // Recency bonus (newer posts get slight boost)
          const daysSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceCreation < 7) {
            score += Math.max(0, 5 - Math.floor(daysSinceCreation))
          }
          
          // Popularity bonus (posts with more reactions/comments)
          score += Math.min(post.reactionCount * 0.5, 5)
          score += Math.min(post.commentCount * 0.3, 3)
          
          return score > 0 ? { post, score, matches } : null
        })
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .sort((a, b) => {
          // Primary sort by relevance score
          if (b.score !== a.score) {
            return b.score - a.score
          }
          // Secondary sort by date (newest first)
          return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()
        })
        .slice(offset, offset + limit)
        .map(result => result.post)

      // Cache results
      this.cacheSearchResults(cacheKey, searchResults)
      
      return searchResults
    } catch (error) {
      console.error('Error searching posts:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search posts',
      })
    }
  }

  /**
   * Get popular hashtags with usage counts
   */
  async getPopularHashtags(limit: number = 10): Promise<{ hashtag: string; count: number }[]> {
    try {
      // Check cache first
      const cacheKey = `popular_hashtags:${limit}`
      const cached = this.searchCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.results as unknown as { hashtag: string; count: number }[]
      }

      const data = await loadData()
      const posts = Object.values(data.posts)
      
      // Count hashtag usage across all posts
      const hashtagCounts: Record<string, number> = {}
      posts.forEach(post => {
        if (post.hashtags && post.hashtags.length > 0) {
          post.hashtags.forEach(hashtag => {
            const normalized = hashtag.toLowerCase()
            hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1
          })
        }
      })
      
      // Return top hashtags by usage count
      const results = Object.entries(hashtagCounts)
        .map(([hashtag, count]) => ({ hashtag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      // Cache results
      this.searchCache.set(cacheKey, {
        results: results as unknown as Post[],
        timestamp: Date.now()
      })

      return results
    } catch (error) {
      console.error('Error fetching popular hashtags:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch popular hashtags',
      })
    }
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<Array<{ type: 'hashtag' | 'user'; value: string }>> {
    try {
      const data = await loadData()
      const posts = Object.values(data.posts)
      
      const normalizedQuery = query.toLowerCase().trim()
      const suggestions: Array<{ type: 'hashtag' | 'user'; value: string }> = []
      
      // Get hashtag suggestions
      const hashtags = new Set<string>()
      posts.forEach(post => {
        if (post.hashtags && post.hashtags.length > 0) {
          post.hashtags.forEach(tag => {
            const normalized = tag.toLowerCase()
            if (normalized.startsWith(normalizedQuery) && normalized !== normalizedQuery) {
              hashtags.add(tag)
            }
          })
        }
      })
      
      // Get author name suggestions
      const authors = new Set<string>()
      posts.forEach(post => {
        if (post.authorName.toLowerCase().includes(normalizedQuery)) {
          authors.add(post.authorName)
        }
      })
      
      // Combine suggestions with hashtags first, then authors
      const hashtagSuggestions = Array.from(hashtags)
        .slice(0, Math.ceil(limit / 2))
        .map(tag => ({ type: 'hashtag' as const, value: `#${tag}` }))
      
      const authorSuggestions = Array.from(authors)
        .slice(0, limit - hashtagSuggestions.length)
        .map(author => ({ type: 'user' as const, value: author }))
      
      return [...hashtagSuggestions, ...authorSuggestions]
    } catch (error) {
      console.error('Error fetching search suggestions:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch search suggestions',
      })
    }
  }

  /**
   * Cache search results with size limit
   */
  private cacheSearchResults(key: string, results: Post[]) {
    // Clear old entries if cache is full
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.searchCache.keys().next().value
      if (oldestKey) {
        this.searchCache.delete(oldestKey)
      }
    }
    
    this.searchCache.set(key, {
      results,
      timestamp: Date.now()
    })
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear()
  }

  /**
   * Get cache stats for monitoring
   */
  getCacheStats() {
    const now = Date.now()
    const validEntries = Array.from(this.searchCache.values())
      .filter(entry => (now - entry.timestamp) < this.CACHE_TTL)
    
    return {
      totalEntries: this.searchCache.size,
      validEntries: validEntries.length,
      hitRate: validEntries.length / Math.max(this.searchCache.size, 1),
      oldestEntry: this.searchCache.size > 0 ? 
        Math.min(...Array.from(this.searchCache.values()).map(e => e.timestamp)) : null
    }
  }
}

// Export singleton instance
export const searchService = new SearchService()