import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchService } from '@/server/services/searchService'
import type { Post } from '@/types/shared'

// Mock the storage functions
vi.mock('@/server/utils/storage', () => ({
  getPosts: vi.fn(),
  getPostsByHashtag: vi.fn(),
}))

// Mock hashtag utilities
vi.mock('@/utils/hashtags', () => ({
  extractHashtags: vi.fn((content: string) => {
    const matches = content.match(/#(\w+)/g)
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : []
  }),
}))

import { getPosts, getPostsByHashtag } from '@/server/utils/storage'

describe('SearchService', () => {
  let searchService: SearchService
  const mockPosts: Post[] = [
    {
      id: '1',
      content: 'Learning #javascript and #react today!',
      authorId: 'user1',
      authorName: 'John Doe',
      hashtags: ['javascript', 'react'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      mood: 'excited',
      reactions: [],
      reactionCounts: {},
      commentCount: 0,
    },
    {
      id: '2',
      content: 'Building a great web application with modern tools',
      authorId: 'user2',
      authorName: 'Jane Smith',
      hashtags: ['webdev', 'tools'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      mood: 'productive',
      reactions: [],
      reactionCounts: {},
      commentCount: 5,
    },
    {
      id: '3',
      content: 'JavaScript tips and tricks for developers #javascript #programming',
      authorId: 'user1',
      authorName: 'John Doe',
      hashtags: ['javascript', 'programming'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      mood: 'helpful',
      reactions: [],
      reactionCounts: {},
      commentCount: 2,
    },
  ]

  beforeEach(() => {
    searchService = new SearchService()
    vi.mocked(getPosts).mockResolvedValue(mockPosts)
    vi.mocked(getPostsByHashtag).mockResolvedValue([mockPosts[0], mockPosts[2]])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('searchPosts', () => {
    it('returns posts matching search query in content', async () => {
      const results = await searchService.searchPosts('javascript')
      
      expect(results).toHaveLength(2)
      expect(results[0].content).toContain('javascript')
      expect(results[1].content).toContain('JavaScript')
    })

    it('returns posts matching search query in author name', async () => {
      const results = await searchService.searchPosts('john')
      
      expect(results).toHaveLength(2)
      expect(results.every(post => post.authorName.toLowerCase().includes('john'))).toBe(true)
    })

    it('returns posts matching hashtags', async () => {
      const results = await searchService.searchPosts('react')
      
      expect(results).toHaveLength(1)
      expect(results[0].hashtags).toContain('react')
    })

    it('applies pagination correctly', async () => {
      const results = await searchService.searchPosts('javascript', 1, 0)
      
      expect(results).toHaveLength(1)
    })

    it('returns empty array for non-matching query', async () => {
      const results = await searchService.searchPosts('nonexistent')
      
      expect(results).toHaveLength(0)
    })

    it('handles empty query by returning recent posts', async () => {
      const results = await searchService.searchPosts('')
      
      expect(results).toEqual(mockPosts.slice(0, 20))
    })

    it('caches search results', async () => {
      // First call
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(1)
      
      // Second call with same query should use cache
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(1)
    })

    it('scores results by relevance', async () => {
      const results = await searchService.searchPosts('javascript')
      
      // Posts with multiple matches should score higher
      expect(results[0].content.toLowerCase().split('javascript')).toHaveLength(3) // 2 matches + 1 split
    })
  })

  describe('getPopularHashtags', () => {
    it('returns popular hashtags sorted by count', async () => {
      const hashtags = await searchService.getPopularHashtags()
      
      expect(hashtags).toEqual([
        { hashtag: 'javascript', count: 2, recentUsage: new Date('2024-01-03') },
        { hashtag: 'programming', count: 1, recentUsage: new Date('2024-01-03') },
        { hashtag: 'react', count: 1, recentUsage: new Date('2024-01-01') },
        { hashtag: 'tools', count: 1, recentUsage: new Date('2024-01-02') },
        { hashtag: 'webdev', count: 1, recentUsage: new Date('2024-01-02') },
      ])
    })

    it('applies limit correctly', async () => {
      const hashtags = await searchService.getPopularHashtags(3)
      
      expect(hashtags).toHaveLength(3)
      expect(hashtags[0].hashtag).toBe('javascript')
    })

    it('handles posts without hashtags', async () => {
      const postsWithoutHashtags = [
        {
          ...mockPosts[0],
          hashtags: [],
        },
      ]
      vi.mocked(getPosts).mockResolvedValue(postsWithoutHashtags)
      
      const hashtags = await searchService.getPopularHashtags()
      
      expect(hashtags).toHaveLength(0)
    })
  })

  describe('getSuggestions', () => {
    it('returns hashtag suggestions for partial query', async () => {
      const suggestions = await searchService.getSuggestions('java')
      
      expect(suggestions).toContain('javascript')
    })

    it('returns user suggestions for partial query', async () => {
      const suggestions = await searchService.getSuggestions('john')
      
      expect(suggestions).toContain('John Doe')
    })

    it('limits suggestions correctly', async () => {
      const suggestions = await searchService.getSuggestions('j', 2)
      
      expect(suggestions).toHaveLength(2)
    })

    it('returns empty array for short queries', async () => {
      const suggestions = await searchService.getSuggestions('j')
      
      // Should return empty for single character
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('caching', () => {
    it('expires cache after TTL', async () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now
      let mockTime = Date.now()
      Date.now = vi.fn(() => mockTime)
      
      // First call
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(1)
      
      // Advance time past TTL (5 minutes)
      mockTime += 6 * 60 * 1000
      
      // Second call should not use cache
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(2)
      
      Date.now = originalNow
    })

    it('clears cache when storage is updated', async () => {
      // This would be implemented when we add cache invalidation hooks
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(1)
      
      // Simulate cache clear
      searchService.clearCache()
      
      await searchService.searchPosts('javascript')
      expect(getPosts).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('handles storage errors gracefully', async () => {
      vi.mocked(getPosts).mockRejectedValue(new Error('Storage error'))
      
      await expect(searchService.searchPosts('test')).rejects.toThrow('Storage error')
    })

    it('handles invalid input gracefully', async () => {
      const results = await searchService.searchPosts(null as any)
      
      expect(results).toHaveLength(0)
    })
  })
})