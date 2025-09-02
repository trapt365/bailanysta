import { Post } from '@/types/shared'
import { updatePost, deletePost, getPostById, getUserPosts, deleteComment, getUserReaction, getPosts } from '../utils/storage'
import { TRPCError } from '@trpc/server'
import { extractHashtags } from '@/utils/hashtags'

export class PostService {
  /**
   * Updates a post with authorization check
   * Only the post author can update their post
   */
  async updatePost(postId: string, updates: Partial<Post>, authorId: string): Promise<Post> {
    try {
      // First verify the post exists and get current data
      const existingPost = await getPostById(postId)
      
      if (!existingPost) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        })
      }
      
      // Authorization check - only post author can update
      if (existingPost.authorId !== authorId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own posts',
        })
      }
      
      // Prepare updates with extracted hashtags if content is being updated
      const processedUpdates = { ...updates }
      if (updates.content) {
        processedUpdates.hashtags = extractHashtags(updates.content)
      }
      
      // Update the post through storage layer
      const updatedPost = await updatePost(postId, processedUpdates)
      
      if (!updatedPost) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update post',
        })
      }
      
      return updatedPost
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      console.error('Error updating post:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating the post',
      })
    }
  }
  
  /**
   * Deletes a post with authorization check and cascade operations
   * Only the post author can delete their post
   * Removes associated comments and reactions
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      // First verify the post exists and get current data
      const existingPost = await getPostById(postId)
      
      if (!existingPost) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        })
      }
      
      // Authorization check - only post author can delete
      if (existingPost.authorId !== authorId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts',
        })
      }
      
      // Note: The storage layer deletePost function already handles cascade operations
      // for comments and reactions in the storage implementation
      const deleted = await deletePost(postId)
      
      if (!deleted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete post',
        })
      }
      
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      console.error('Error deleting post:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while deleting the post',
      })
    }
  }
  
  /**
   * Get posts by user with ownership information
   * Used by profile components to determine edit/delete permissions
   */
  async getUserPostsWithOwnership(userId: string, currentUserId: string, options?: { 
    limit?: number
    offset?: number
  }): Promise<(Post & { isOwner: boolean })[]> {
    try {
      const userPosts = await getUserPosts(userId, options)
      
      // Add ownership flag for UI permissions
      return userPosts.map(post => ({
        ...post,
        isOwner: post.authorId === currentUserId
      }))
      
    } catch (error) {
      console.error('Error fetching user posts:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user posts',
      })
    }
  }
  
  /**
   * Build hashtag index from all posts for search optimization
   * Returns a map of hashtags to post IDs for efficient lookups
   */
  async buildHashtagIndex(): Promise<Map<string, Set<string>>> {
    try {
      const allPosts = await getPosts({ sortBy: 'createdAt' })
      const hashtagIndex = new Map<string, Set<string>>()
      
      for (const post of allPosts) {
        if (post.hashtags && post.hashtags.length > 0) {
          for (const hashtag of post.hashtags) {
            const normalizedTag = hashtag.toLowerCase()
            if (!hashtagIndex.has(normalizedTag)) {
              hashtagIndex.set(normalizedTag, new Set())
            }
            hashtagIndex.get(normalizedTag)!.add(post.id)
          }
        }
      }
      
      return hashtagIndex
    } catch (error) {
      console.error('Error building hashtag index:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to build hashtag index',
      })
    }
  }
  
  /**
   * Get hashtag statistics for analytics and popular hashtags display
   */
  async getHashtagStats(): Promise<Array<{ hashtag: string; count: number; recentUsage: Date }>> {
    try {
      const allPosts = await getPosts({ sortBy: 'createdAt' })
      const hashtagStats = new Map<string, { count: number; recentUsage: Date }>()
      
      for (const post of allPosts) {
        if (post.hashtags && post.hashtags.length > 0) {
          for (const hashtag of post.hashtags) {
            const normalizedTag = hashtag.toLowerCase()
            const currentStats = hashtagStats.get(normalizedTag) || { count: 0, recentUsage: new Date(0) }
            
            hashtagStats.set(normalizedTag, {
              count: currentStats.count + 1,
              recentUsage: post.createdAt > currentStats.recentUsage ? post.createdAt : currentStats.recentUsage
            })
          }
        }
      }
      
      // Convert to array and sort by count (descending) and recent usage
      return Array.from(hashtagStats.entries())
        .map(([hashtag, stats]) => ({ hashtag, ...stats }))
        .sort((a, b) => {
          // Primary sort: count (descending)
          if (b.count !== a.count) {
            return b.count - a.count
          }
          // Secondary sort: recent usage (descending)
          return b.recentUsage.getTime() - a.recentUsage.getTime()
        })
    } catch (error) {
      console.error('Error getting hashtag stats:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get hashtag statistics',
      })
    }
  }
}

// Export singleton instance
export const postService = new PostService()