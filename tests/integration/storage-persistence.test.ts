import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { 
  createPost, 
  getPosts, 
  createUser,
  backup,
  clearCache
} from '@/server/utils/storage'

const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'integration-test')
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'bailanysta.json')
const TEST_BACKUP_FILE = path.join(TEST_DATA_DIR, 'bailanysta.backup.json')

describe('Storage Integration Tests - Data Persistence Workflows', () => {
  beforeEach(async () => {
    // Clear cache and setup clean test environment
    clearCache()
    
    await fs.mkdir(TEST_DATA_DIR, { recursive: true })
    
    // Override environment for integration tests
    process.env.DATA_FILE = TEST_DATA_FILE
    process.env.BACKUP_FILE = TEST_BACKUP_FILE
  })

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rmdir(TEST_DATA_DIR, { recursive: true })
    } catch (error) {
      // Ignore cleanup errors
    }
    
    clearCache()
  })

  describe('End-to-End Data Persistence', () => {
    it('should persist data across multiple operations', async () => {
      // Step 1: Create initial data
      const user1 = await createUser('Alice', 'alice@example.com')
      const user2 = await createUser('Bob', 'bob@example.com')
      
      const post1 = await createPost('Hello world! #greeting', user1.id, user1.name, 'Happy')
      const post2 = await createPost('Learning TypeScript #coding #typescript', user2.id, user2.name, 'Contemplative')
      
      // Step 2: Clear cache to force file read
      clearCache()
      
      // Step 3: Verify data persistence
      const retrievedPosts = await getPosts()
      expect(retrievedPosts).toHaveLength(2)
      
      const foundPost1 = retrievedPosts.find(p => p.id === post1.id)
      const foundPost2 = retrievedPosts.find(p => p.id === post2.id)
      
      expect(foundPost1).toMatchObject({
        content: 'Hello world! #greeting',
        authorName: 'Alice',
        mood: 'Happy',
        hashtags: ['greeting']
      })
      
      expect(foundPost2).toMatchObject({
        content: 'Learning TypeScript #coding #typescript',
        authorName: 'Bob',
        mood: 'Contemplative',
        hashtags: ['coding', 'typescript']
      })
    })

    it('should handle concurrent operations safely', async () => {
      const user = await createUser('Test User', 'test@example.com')
      
      // Simulate concurrent post creation
      const concurrentPosts = await Promise.all([
        createPost('Post 1 #concurrent', user.id, user.name),
        createPost('Post 2 #concurrent', user.id, user.name),
        createPost('Post 3 #concurrent', user.id, user.name),
        createPost('Post 4 #concurrent', user.id, user.name),
        createPost('Post 5 #concurrent', user.id, user.name)
      ])
      
      expect(concurrentPosts).toHaveLength(5)
      
      // Clear cache and verify all posts were saved
      clearCache()
      const allPosts = await getPosts()
      expect(allPosts).toHaveLength(5)
      
      // Verify each post has unique ID
      const ids = new Set(allPosts.map(p => p.id))
      expect(ids.size).toBe(5)
    })

    it('should maintain data integrity during backup operations', async () => {
      // Create initial data
      const user = await createUser('Backup Test', 'backup@example.com')
      const post = await createPost('Important data #backup', user.id, user.name)
      
      // Verify backup creation
      const backupSuccess = await backup()
      expect(backupSuccess).toBe(true)
      
      // Verify backup file contains correct data
      const backupData = JSON.parse(await fs.readFile(TEST_BACKUP_FILE, 'utf-8'))
      expect(backupData.posts[post.id]).toMatchObject({
        content: 'Important data #backup',
        authorName: 'Backup Test',
        hashtags: ['backup']
      })
      expect(backupData.users[user.id]).toMatchObject({
        name: 'Backup Test',
        email: 'backup@example.com'
      })
    })

    it('should recover from file corruption using backup', async () => {
      // Create initial data and backup
      const user = await createUser('Recovery Test', 'recovery@example.com')
      const post = await createPost('Recovery data #test', user.id, user.name)
      
      await backup()
      
      // Simulate file corruption
      await fs.writeFile(TEST_DATA_FILE, 'corrupted data')
      clearCache()
      
      // Manually restore from backup (simulating recovery process)
      await fs.copyFile(TEST_BACKUP_FILE, TEST_DATA_FILE)
      clearCache()
      
      // Verify data recovery
      const recoveredPosts = await getPosts()
      expect(recoveredPosts).toHaveLength(1)
      expect(recoveredPosts[0]).toMatchObject({
        content: 'Recovery data #test',
        authorName: 'Recovery Test'
      })
    })
  })

  describe('Performance and Scale', () => {
    it('should handle large dataset operations efficiently', async () => {
      const startTime = Date.now()
      
      // Create test user
      const user = await createUser('Performance Test', 'perf@example.com')
      
      // Create 100 posts with various hashtags
      const createPromises = []
      for (let i = 0; i < 100; i++) {
        const content = `Performance test post ${i} #perf #test${i % 10} #batch`
        createPromises.push(createPost(content, user.id, user.name, i % 2 ? 'Happy' : 'Contemplative'))
      }
      
      await Promise.all(createPromises)
      
      // Test retrieval with pagination
      const firstPage = await getPosts({ limit: 25, offset: 0 })
      const secondPage = await getPosts({ limit: 25, offset: 25 })
      
      expect(firstPage).toHaveLength(25)
      expect(secondPage).toHaveLength(25)
      
      // Test sorting performance
      const sortedByReaction = await getPosts({ sortBy: 'reactionCount' })
      expect(sortedByReaction).toHaveLength(100)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 5 seconds (performance requirement)
      expect(duration).toBeLessThan(5000)
      
      // Verify file size is reasonable (should be under 1MB for 100 posts)
      const stats = await fs.stat(TEST_DATA_FILE)
      expect(stats.size).toBeLessThan(1024 * 1024) // 1MB
    })

    it('should maintain response times under load', async () => {
      const user = await createUser('Load Test', 'load@example.com')
      
      // Create baseline data
      for (let i = 0; i < 50; i++) {
        await createPost(`Baseline post ${i}`, user.id, user.name)
      }
      
      // Test response times for various operations
      const operations = []
      
      // Test read operations
      const readStart = Date.now()
      for (let i = 0; i < 10; i++) {
        operations.push(getPosts({ limit: 10 }))
      }
      await Promise.all(operations)
      const readDuration = Date.now() - readStart
      
      // Each read operation should average under 50ms
      expect(readDuration / 10).toBeLessThan(50)
      
      // Test write operations
      const writeStart = Date.now()
      const writeOps = []
      for (let i = 0; i < 10; i++) {
        writeOps.push(createPost(`Load test ${i}`, user.id, user.name))
      }
      await Promise.all(writeOps)
      const writeDuration = Date.now() - writeStart
      
      // Each write operation should average under 100ms
      expect(writeDuration / 10).toBeLessThan(100)
    })
  })

  describe('Data Migration Scenarios', () => {
    it('should handle legacy data format migration', async () => {
      // Create legacy format data (version 0 - no version field)
      const legacyData = {
        users: {
          'user1': {
            id: 'user1',
            name: 'Legacy User',
            email: 'legacy@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        posts: {
          'post1': {
            id: 'post1',
            content: 'Legacy post #migration',
            authorId: 'user1',
            authorName: 'Legacy User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mood: 'Happy',
            hashtags: ['migration'],
            reactionCount: 0,
            commentCount: 0
          }
        },
        comments: {},
        reactions: {}
      }
      
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(legacyData, null, 2))
      clearCache()
      
      // Access data should trigger automatic migration
      const posts = await getPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0].content).toBe('Legacy post #migration')
      
      // Verify file was upgraded with metadata
      const upgradedData = JSON.parse(await fs.readFile(TEST_DATA_FILE, 'utf-8'))
      expect(upgradedData.version).toBe(1)
      expect(upgradedData.metadata).toBeDefined()
      expect(upgradedData.metadata.totalPosts).toBe(1)
      expect(upgradedData.metadata.totalUsers).toBe(1)
    })
  })

  describe('Error Recovery Workflows', () => {
    it('should handle partial write failures gracefully', async () => {
      const user = await createUser('Error Test', 'error@example.com')
      
      // Create some baseline data
      await createPost('Baseline post', user.id, user.name)
      
      // Mock a write failure by making file readonly
      await fs.chmod(TEST_DATA_FILE, 0o444) // Read-only
      
      try {
        await createPost('Should fail', user.id, user.name)
        expect.fail('Expected write to fail')
      } catch (error: any) {
        expect(error.code).toContain('STORAGE_WRITE_FAILED')
      }
      
      // Restore write permissions
      await fs.chmod(TEST_DATA_FILE, 0o666)
      clearCache()
      
      // Verify original data is still intact
      const posts = await getPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0].content).toBe('Baseline post')
      
      // Verify we can continue working normally
      const newPost = await createPost('Recovery successful', user.id, user.name)
      expect(newPost.content).toBe('Recovery successful')
    })

    it('should create new file when data directory is missing', async () => {
      // Remove entire data directory
      await fs.rmdir(TEST_DATA_DIR, { recursive: true })
      clearCache()
      
      // Should recreate directory and file automatically
      const user = await createUser('New Start', 'newstart@example.com')
      expect(user.name).toBe('New Start')
      
      // Verify directory and file were created
      const dirExists = await fs.access(TEST_DATA_DIR).then(() => true).catch(() => false)
      const fileExists = await fs.access(TEST_DATA_FILE).then(() => true).catch(() => false)
      
      expect(dirExists).toBe(true)
      expect(fileExists).toBe(true)
    })
  })
})