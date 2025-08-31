import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost, 
  deletePost,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  createComment,
  getCommentsByPostId,
  deleteComment,
  backup,
  migrate,
  validateIntegrity,
  getStats,
  clearCache,
  JSONFileStorage,
  storage,
  STORAGE_ERROR_CODES
} from '@/server/utils/storage'

const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'test')
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'bailanysta.json')
const TEST_BACKUP_FILE = path.join(TEST_DATA_DIR, 'bailanysta.backup.json')

// Mock the data file paths for testing
const originalDataFile = process.env.DATA_FILE
const originalBackupFile = process.env.BACKUP_FILE

describe('Storage System Tests', () => {
  beforeEach(async () => {
    // Clear cache before each test
    clearCache()
    
    // Create test directory
    await fs.mkdir(TEST_DATA_DIR, { recursive: true })
    
    // Create clean test data file
    const initialData = {
      version: 1,
      users: {},
      posts: {},
      comments: {},
      reactions: {},
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalPosts: 0,
        totalUsers: 0
      }
    }
    
    await fs.writeFile(TEST_DATA_FILE, JSON.stringify(initialData, null, 2))
    
    // Override environment variables for testing
    process.env.DATA_FILE = TEST_DATA_FILE
    process.env.BACKUP_FILE = TEST_BACKUP_FILE
  })

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rmdir(TEST_DATA_DIR, { recursive: true })
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Restore original environment variables
    if (originalDataFile) {
      process.env.DATA_FILE = originalDataFile
    } else {
      delete process.env.DATA_FILE
    }
    
    if (originalBackupFile) {
      process.env.BACKUP_FILE = originalBackupFile
    } else {
      delete process.env.BACKUP_FILE
    }
    
    clearCache()
  })

  describe('Post Operations', () => {
    it('should create a post successfully', async () => {
      const post = await createPost(
        'Hello world! #test',
        'user1',
        'John Doe',
        'Happy'
      )

      expect(post).toMatchObject({
        content: 'Hello world! #test',
        authorId: 'user1',
        authorName: 'John Doe',
        mood: 'Happy',
        hashtags: ['test'],
        reactionCount: 0,
        commentCount: 0
      })
      expect(post.id).toBeDefined()
      expect(post.createdAt).toBeInstanceOf(Date)
      expect(post.updatedAt).toBeInstanceOf(Date)
    })

    it('should extract hashtags correctly', async () => {
      const post = await createPost(
        'Testing #hashtag #extraction #test',
        'user1',
        'John Doe'
      )

      expect(post.hashtags).toEqual(['hashtag', 'extraction', 'test'])
    })

    it('should validate post data', async () => {
      await expect(
        createPost('', 'user1', 'John Doe')
      ).rejects.toThrow('Post validation failed')
    })

    it('should retrieve posts with pagination', async () => {
      // Create multiple posts
      await createPost('Post 1', 'user1', 'John Doe')
      await createPost('Post 2', 'user1', 'John Doe')
      await createPost('Post 3', 'user1', 'John Doe')

      const posts = await getPosts({ limit: 2, offset: 0 })
      expect(posts).toHaveLength(2)
      expect(posts[0].content).toBe('Post 3') // Most recent first
      expect(posts[1].content).toBe('Post 2')

      const nextPage = await getPosts({ limit: 2, offset: 2 })
      expect(nextPage).toHaveLength(1)
      expect(nextPage[0].content).toBe('Post 1')
    })

    it('should sort posts by different criteria', async () => {
      const post1 = await createPost('Post 1', 'user1', 'John Doe')
      const post2 = await createPost('Post 2', 'user1', 'John Doe')
      
      // Update reaction count for sorting test
      await updatePost(post1.id, { reactionCount: 10 })
      await updatePost(post2.id, { reactionCount: 5 })

      const postsByReaction = await getPosts({ sortBy: 'reactionCount' })
      expect(postsByReaction[0].reactionCount).toBe(10)
      expect(postsByReaction[1].reactionCount).toBe(5)
    })

    it('should retrieve post by ID', async () => {
      const created = await createPost('Test post', 'user1', 'John Doe')
      const retrieved = await getPostById(created.id)

      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent post', async () => {
      const post = await getPostById('non-existent-id')
      expect(post).toBeNull()
    })

    it('should update a post successfully', async () => {
      const created = await createPost('Original content', 'user1', 'John Doe')
      const updated = await updatePost(created.id, {
        content: 'Updated content',
        reactionCount: 5
      })

      expect(updated).toMatchObject({
        id: created.id,
        content: 'Updated content',
        reactionCount: 5,
        createdAt: created.createdAt
      })
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    it('should validate updated post data', async () => {
      const created = await createPost('Original content', 'user1', 'John Doe')
      
      await expect(
        updatePost(created.id, { content: '' })
      ).rejects.toThrow('Post update validation failed')
    })

    it('should return null when updating non-existent post', async () => {
      const result = await updatePost('non-existent-id', { content: 'Updated' })
      expect(result).toBeNull()
    })

    it('should delete a post successfully', async () => {
      const created = await createPost('To be deleted', 'user1', 'John Doe')
      const deleted = await deletePost(created.id)

      expect(deleted).toBe(true)
      
      const retrieved = await getPostById(created.id)
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent post', async () => {
      const result = await deletePost('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('User Operations', () => {
    it('should create a user successfully', async () => {
      const user = await createUser('John Doe', 'john@example.com')

      expect(user).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com'
      })
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should validate user data', async () => {
      await expect(
        createUser('', 'john@example.com')
      ).rejects.toThrow('User validation failed')

      await expect(
        createUser('John Doe', 'invalid-email')
      ).rejects.toThrow('User validation failed')
    })

    it('should retrieve user by ID', async () => {
      const created = await createUser('John Doe', 'john@example.com')
      const retrieved = await getUserById(created.id)

      expect(retrieved).toEqual(created)
    })

    it('should update a user successfully', async () => {
      const created = await createUser('John Doe', 'john@example.com')
      const updated = await updateUser(created.id, {
        name: 'John Smith'
      })

      expect(updated).toMatchObject({
        id: created.id,
        name: 'John Smith',
        email: 'john@example.com',
        createdAt: created.createdAt
      })
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    it('should delete a user successfully', async () => {
      const created = await createUser('John Doe', 'john@example.com')
      const deleted = await deleteUser(created.id)

      expect(deleted).toBe(true)
      
      const retrieved = await getUserById(created.id)
      expect(retrieved).toBeNull()
    })
  })

  describe('Data Integrity and Backup', () => {
    it('should create backup successfully', async () => {
      await createPost('Test post', 'user1', 'John Doe')
      const result = await backup()

      expect(result).toBe(true)
      
      // Verify backup file exists
      const backupExists = await fs.access(TEST_BACKUP_FILE)
        .then(() => true)
        .catch(() => false)
      expect(backupExists).toBe(true)
    })

    it('should validate data integrity', async () => {
      await createPost('Test post', 'user1', 'John Doe')
      await createUser('John Doe', 'john@example.com')
      
      const isValid = await validateIntegrity()
      expect(isValid).toBe(true)
    })

    it('should detect data corruption', async () => {
      // Manually corrupt the data file
      await fs.writeFile(TEST_DATA_FILE, '{"invalid": json}')
      
      const isValid = await validateIntegrity()
      expect(isValid).toBe(false)
    })

    it('should migrate data version', async () => {
      const result = await migrate(1, 2)
      expect(result).toBe(true)
      
      // Verify version was updated
      const data = JSON.parse(await fs.readFile(TEST_DATA_FILE, 'utf-8'))
      expect(data.version).toBe(2)
    })

    it('should return correct stats', async () => {
      await createPost('Post 1', 'user1', 'John Doe')
      await createPost('Post 2', 'user1', 'John Doe')
      await createUser('John Doe', 'john@example.com')
      
      const stats = await getStats()
      expect(stats).toEqual({
        totalPosts: 2,
        totalUsers: 1
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle file not found errors', async () => {
      await fs.unlink(TEST_DATA_FILE)
      
      // Should recreate file and continue working
      const post = await createPost('Test post', 'user1', 'John Doe')
      expect(post).toBeDefined()
    })

    it('should handle corrupted JSON', async () => {
      await fs.writeFile(TEST_DATA_FILE, 'invalid json content')
      
      await expect(
        getPostById('any-id')
      ).rejects.toThrow('Data file is corrupted')
    })

    it('should provide error codes and details', async () => {
      await fs.writeFile(TEST_DATA_FILE, 'invalid json content')
      
      try {
        await getPostById('any-id')
      } catch (error: any) {
        expect(error.code).toBe(STORAGE_ERROR_CODES.CORRUPTED_DATA)
        expect(error.details).toBeDefined()
      }
    })
  })

  describe('Caching System', () => {
    it('should use cache for repeated reads', async () => {
      await createPost('Test post', 'user1', 'John Doe')
      
      // First read should populate cache
      const posts1 = await getPosts()
      
      // Manually modify file to test cache
      await fs.writeFile(TEST_DATA_FILE, '{"different": "data"}')
      
      // Second read should use cache (within TTL)
      const posts2 = await getPosts()
      expect(posts2).toEqual(posts1)
      
      // Clear cache and try again
      clearCache()
      
      // This should fail because file is corrupted
      await expect(getPosts()).rejects.toThrow()
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now()
      
      // Create 100 posts
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(createPost(`Post ${i}`, `user${i}`, `User ${i}`))
      }
      await Promise.all(promises)
      
      // Retrieve all posts
      const posts = await getPosts()
      expect(posts).toHaveLength(100)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 5 seconds (generous for CI)
      expect(duration).toBeLessThan(5000)
    })

    it('should paginate efficiently', async () => {
      // Create 50 posts
      for (let i = 0; i < 50; i++) {
        await createPost(`Post ${i}`, 'user1', 'John Doe')
      }
      
      const startTime = Date.now()
      const posts = await getPosts({ limit: 10, offset: 20 })
      const endTime = Date.now()
      
      expect(posts).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(500) // Should be fast
    })
  })

  describe('Comment Operations', () => {
    let testPost: Awaited<ReturnType<typeof createPost>>

    beforeEach(async () => {
      testPost = await createPost('Test post content', 'user1', 'John Doe')
    })

    describe('createComment', () => {
      it('should create a comment successfully', async () => {
        const comment = await createComment(
          testPost.id,
          'This is a test comment',
          'user2',
          'Jane Smith'
        )

        expect(comment).toMatchObject({
          id: expect.any(String),
          content: 'This is a test comment',
          postId: testPost.id,
          authorId: 'user2',
          authorName: 'Jane Smith',
          createdAt: expect.any(Date)
        })
      })

      it('should increment post comment count', async () => {
        await createComment(testPost.id, 'Comment 1', 'user2', 'Jane Smith')
        await createComment(testPost.id, 'Comment 2', 'user3', 'Bob Johnson')

        const updatedPost = await getPostById(testPost.id)
        expect(updatedPost?.commentCount).toBe(2)
      })

      it('should trim comment content', async () => {
        const comment = await createComment(
          testPost.id,
          '  Trimmed comment  ',
          'user2',
          'Jane Smith'
        )

        expect(comment.content).toBe('Trimmed comment')
      })

      it('should throw error for non-existent post', async () => {
        await expect(
          createComment('non-existent-id', 'Comment', 'user2', 'Jane Smith')
        ).rejects.toThrow('Post not found')
      })

      it('should validate comment data', async () => {
        // Test would fail due to validation - assuming empty content fails validation
        await expect(
          createComment(testPost.id, '', 'user2', 'Jane Smith')
        ).rejects.toThrow()
      })
    })

    describe('getCommentsByPostId', () => {
      it('should return comments in chronological order', async () => {
        const comment1 = await createComment(testPost.id, 'First comment', 'user2', 'Jane Smith')
        
        // Wait a bit to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
        
        const comment2 = await createComment(testPost.id, 'Second comment', 'user3', 'Bob Johnson')

        const comments = await getCommentsByPostId(testPost.id)
        
        expect(comments).toHaveLength(2)
        expect(comments[0].id).toBe(comment1.id)
        expect(comments[1].id).toBe(comment2.id)
        expect(new Date(comments[0].createdAt).getTime()).toBeLessThanOrEqual(
          new Date(comments[1].createdAt).getTime()
        )
      })

      it('should return empty array for post with no comments', async () => {
        const comments = await getCommentsByPostId(testPost.id)
        expect(comments).toEqual([])
      })

      it('should only return comments for specified post', async () => {
        const anotherPost = await createPost('Another post', 'user1', 'John Doe')
        
        await createComment(testPost.id, 'Comment for post 1', 'user2', 'Jane Smith')
        await createComment(anotherPost.id, 'Comment for post 2', 'user3', 'Bob Johnson')

        const post1Comments = await getCommentsByPostId(testPost.id)
        const post2Comments = await getCommentsByPostId(anotherPost.id)

        expect(post1Comments).toHaveLength(1)
        expect(post1Comments[0].content).toBe('Comment for post 1')
        
        expect(post2Comments).toHaveLength(1)
        expect(post2Comments[0].content).toBe('Comment for post 2')
      })
    })

    describe('deleteComment', () => {
      it('should delete comment successfully', async () => {
        const comment = await createComment(testPost.id, 'Test comment', 'user2', 'Jane Smith')
        
        const result = await deleteComment(comment.id)
        expect(result).toBe(true)

        const comments = await getCommentsByPostId(testPost.id)
        expect(comments).toHaveLength(0)
      })

      it('should decrement post comment count', async () => {
        const comment1 = await createComment(testPost.id, 'Comment 1', 'user2', 'Jane Smith')
        const comment2 = await createComment(testPost.id, 'Comment 2', 'user3', 'Bob Johnson')

        await deleteComment(comment1.id)

        const updatedPost = await getPostById(testPost.id)
        expect(updatedPost?.commentCount).toBe(1)

        const comments = await getCommentsByPostId(testPost.id)
        expect(comments).toHaveLength(1)
        expect(comments[0].id).toBe(comment2.id)
      })

      it('should return false for non-existent comment', async () => {
        const result = await deleteComment('non-existent-id')
        expect(result).toBe(false)
      })

      it('should handle comment count underflow gracefully', async () => {
        // Manually set comment count to 0
        await updatePost(testPost.id, { commentCount: 0 })
        
        const comment = await createComment(testPost.id, 'Test comment', 'user2', 'Jane Smith')
        
        // Manually set comment count back to 0 (simulate inconsistency)
        await updatePost(testPost.id, { commentCount: 0 })
        
        await deleteComment(comment.id)
        
        const updatedPost = await getPostById(testPost.id)
        expect(updatedPost?.commentCount).toBe(0) // Should not go negative
      })
    })
  })

  describe('JSONFileStorage Class', () => {
    it('should implement IStorage interface', () => {
      expect(storage).toBeInstanceOf(JSONFileStorage)
      expect(typeof storage.createPost).toBe('function')
      expect(typeof storage.getPosts).toBe('function')
      expect(typeof storage.backup).toBe('function')
      expect(typeof storage.createComment).toBe('function')
      expect(typeof storage.getCommentsByPostId).toBe('function')
      expect(typeof storage.deleteComment).toBe('function')
    })

    it('should work with class instance', async () => {
      const post = await storage.createPost('Test', 'user1', 'John Doe')
      const retrieved = await storage.getPostById(post.id)
      
      expect(retrieved).toEqual(post)
    })

    it('should work with comment methods through class instance', async () => {
      const post = await storage.createPost('Test post', 'user1', 'John Doe')
      const comment = await storage.createComment(post.id, 'Test comment', 'user2', 'Jane Smith')
      
      const comments = await storage.getCommentsByPostId(post.id)
      expect(comments).toHaveLength(1)
      expect(comments[0]).toEqual(comment)
      
      const deleted = await storage.deleteComment(comment.id)
      expect(deleted).toBe(true)
      
      const commentsAfterDelete = await storage.getCommentsByPostId(post.id)
      expect(commentsAfterDelete).toHaveLength(0)
    })
  })
})