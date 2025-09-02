import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { Post, User, Reaction, Comment } from '@/types/shared'
import { postSchema, userSchema, reactionSchema, commentSchema } from '@/utils/validation'

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'bailanysta.json')
const BACKUP_FILE = process.env.BACKUP_FILE || path.join(process.cwd(), 'data', 'bailanysta.backup.json')

// Error codes for storage operations
export const STORAGE_ERROR_CODES = {
  FILE_NOT_FOUND: 'STORAGE_FILE_NOT_FOUND',
  CORRUPTED_DATA: 'STORAGE_CORRUPTED_DATA',
  VALIDATION_FAILED: 'STORAGE_VALIDATION_FAILED',
  WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  BACKUP_FAILED: 'STORAGE_BACKUP_FAILED',
  MIGRATION_FAILED: 'STORAGE_MIGRATION_FAILED',
} as const

export interface StorageData {
  version: number
  users: Record<string, User>
  posts: Record<string, Post>
  comments: Record<string, Comment>
  reactions: Record<string, Reaction>
  metadata: {
    createdAt: string
    lastUpdated: string
    totalPosts: number
    totalUsers: number
  }
}

export interface StorageError extends Error {
  code: string
  details?: Record<string, any>
}

// Storage interface for future database migration
export interface IStorage {
  // Post operations
  createPost(content: string, authorId: string, authorName: string, mood?: Post['mood']): Promise<Post>
  getPosts(options?: { limit?: number; offset?: number; sortBy?: string }): Promise<Post[]>
  getPostById(id: string): Promise<Post | null>
  updatePost(id: string, updates: Partial<Post>): Promise<Post | null>
  deletePost(id: string): Promise<boolean>
  
  // User operations
  createUser(name: string, email: string): Promise<User>
  getUserById(id: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User | null>
  deleteUser(id: string): Promise<boolean>
  getUserPosts(userId: string, options?: { limit?: number; offset?: number }): Promise<Post[]>
  
  // Reaction operations
  toggleReaction(postId: string, userId: string): Promise<{ isLiked: boolean; reactionCount: number }>
  getUserReaction(postId: string, userId: string): Promise<Reaction | null>
  getPostReactions(postId: string): Promise<Reaction[]>
  
  // Comment operations
  createComment(postId: string, content: string, authorId: string, authorName: string): Promise<Comment>
  getCommentsByPostId(postId: string): Promise<Comment[]>
  deleteComment(id: string): Promise<boolean>
  
  // Utility operations
  backup(): Promise<boolean>
  migrate(fromVersion: number, toVersion: number): Promise<boolean>
  validateIntegrity(): Promise<boolean>
  getStats(): Promise<{ totalPosts: number; totalUsers: number }>
}

// In-memory cache for frequently accessed data
let dataCache: StorageData | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 seconds

function createStorageError(message: string, code: string, details?: Record<string, any>): StorageError {
  const error = new Error(message) as StorageError
  error.code = code
  error.details = details
  return error
}

async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readData(): Promise<StorageData> {
  // Return cached data if valid
  const now = Date.now()
  if (dataCache && (now - cacheTimestamp) < CACHE_TTL) {
    return dataCache
  }

  try {
    await ensureDataDirectory()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    
    // Validate and migrate if necessary
    const validatedData = await validateAndMigrateData(parsed)
    
    // Update cache
    dataCache = validatedData
    cacheTimestamp = now
    
    return validatedData
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create initial structure
      const initialData = createInitialData()
      await writeData(initialData)
      return initialData
    }
    
    if (error instanceof SyntaxError) {
      throw createStorageError(
        'Data file is corrupted and cannot be parsed',
        STORAGE_ERROR_CODES.CORRUPTED_DATA,
        { originalError: error.message }
      )
    }
    
    throw createStorageError(
      'Failed to read storage data',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: error.message }
    )
  }
}

function createInitialData(): StorageData {
  return {
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
}

async function validateAndMigrateData(data: any): Promise<StorageData> {
  // Basic structure validation
  if (!data || typeof data !== 'object') {
    throw createStorageError(
      'Invalid data structure',
      STORAGE_ERROR_CODES.VALIDATION_FAILED
    )
  }
  
  // Handle legacy data format (no version)
  if (!data.version) {
    data = {
      version: 1,
      users: data.users || {},
      posts: data.posts || {},
      comments: data.comments || {},
      reactions: data.reactions || {},
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalPosts: Object.keys(data.posts || {}).length,
        totalUsers: Object.keys(data.users || {}).length
      }
    }
  }
  
  return data as StorageData
}

async function writeData(data: StorageData): Promise<void> {
  try {
    await ensureDataDirectory()
    
    // Create backup before writing
    await createBackup()
    
    // Update metadata
    data.metadata.lastUpdated = new Date().toISOString()
    data.metadata.totalPosts = Object.keys(data.posts).length
    data.metadata.totalUsers = Object.keys(data.users).length
    
    // Atomic write using temporary file
    const tempFile = `${DATA_FILE}.tmp`
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2))
    await fs.rename(tempFile, DATA_FILE)
    
    // Update cache
    dataCache = data
    cacheTimestamp = Date.now()
    
  } catch (error: any) {
    throw createStorageError(
      'Failed to write storage data',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: error.message }
    )
  }
}

async function createBackup(): Promise<void> {
  try {
    await fs.access(DATA_FILE)
    await fs.copyFile(DATA_FILE, BACKUP_FILE)
  } catch (error) {
    // Ignore if original file doesn't exist
    if ((error as any).code !== 'ENOENT') {
      throw createStorageError(
        'Failed to create backup',
        STORAGE_ERROR_CODES.BACKUP_FAILED,
        { originalError: (error as any).message }
      )
    }
  }
}

// Enhanced Post operations with validation and error handling
export async function createPost(
  content: string,
  authorId: string,
  authorName: string,
  mood?: Post['mood']
): Promise<Post> {
  try {
    const data = await readData()
    
    // Extract hashtags from content
    const hashtags = content.match(/#[\w]+/g)?.map(tag => tag.slice(1).toLowerCase()) || []
    
    const post: Post = {
      id: randomUUID(),
      content: content.trim(),
      authorId,
      authorName,
      createdAt: new Date(),
      updatedAt: new Date(),
      mood,
      hashtags,
      reactionCount: 0,
      commentCount: 0
    }
    
    // Validate post data
    const validationResult = postSchema.safeParse(post)
    if (!validationResult.success) {
      throw createStorageError(
        'Post validation failed',
        STORAGE_ERROR_CODES.VALIDATION_FAILED,
        { errors: validationResult.error.errors }
      )
    }
    
    data.posts[post.id] = post
    await writeData(data)
    
    return post
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to create post',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message }
    )
  }
}

export async function getPosts(options: { 
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'reactionCount'
} = {}): Promise<Post[]> {
  try {
    const data = await readData()
    let posts = Object.values(data.posts)
    
    // Sort posts
    const { sortBy = 'createdAt' } = options
    posts.sort((a, b) => {
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
      }
      return b[sortBy] - a[sortBy]
    })
    
    // Apply pagination
    const { offset = 0, limit } = options
    if (limit) {
      posts = posts.slice(offset, offset + limit)
    }
    
    return posts
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve posts',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message }
    )
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  try {
    const data = await readData()
    return data.posts[id] || null
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve post by ID',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, postId: id }
    )
  }
}

export async function getPostsByHashtag(hashtag: string, options: { 
  limit?: number; 
  offset?: number; 
  sortBy?: string 
} = {}): Promise<Post[]> {
  try {
    const data = await readData()
    const normalizedHashtag = hashtag.toLowerCase()
    
    // Filter posts that contain the specified hashtag
    let posts = Object.values(data.posts).filter(post => 
      post.hashtags && post.hashtags.some(tag => 
        tag.toLowerCase() === normalizedHashtag
      )
    )
    
    // Sort posts
    const { sortBy = 'createdAt' } = options
    posts.sort((a, b) => {
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
      }
      return b[sortBy] - a[sortBy]
    })
    
    // Apply pagination
    const { offset = 0, limit } = options
    if (limit) {
      posts = posts.slice(offset, offset + limit)
    }
    
    return posts
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve posts by hashtag',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, hashtag }
    )
  }
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
  try {
    const data = await readData()
    const existingPost = data.posts[id]
    
    if (!existingPost) {
      return null
    }
    
    const updatedPost = {
      ...existingPost,
      ...updates,
      id: existingPost.id, // Prevent ID changes
      createdAt: existingPost.createdAt, // Prevent creation date changes
      updatedAt: new Date()
    }
    
    // Validate updated post
    const validationResult = postSchema.safeParse(updatedPost)
    if (!validationResult.success) {
      throw createStorageError(
        'Post update validation failed',
        STORAGE_ERROR_CODES.VALIDATION_FAILED,
        { errors: validationResult.error.errors }
      )
    }
    
    data.posts[id] = updatedPost
    await writeData(data)
    
    return updatedPost
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to update post',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, postId: id }
    )
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const data = await readData()
    if (data.posts[id]) {
      // Cascade deletion: remove associated comments
      const commentsToDelete = Object.keys(data.comments).filter(
        commentId => data.comments[commentId].postId === id
      )
      commentsToDelete.forEach(commentId => {
        delete data.comments[commentId]
      })
      
      // Cascade deletion: remove associated reactions
      const reactionsToDelete = Object.keys(data.reactions).filter(
        reactionKey => data.reactions[reactionKey].postId === id
      )
      reactionsToDelete.forEach(reactionKey => {
        delete data.reactions[reactionKey]
      })
      
      // Delete the post itself
      delete data.posts[id]
      
      await writeData(data)
      return true
    }
    return false
  } catch (error) {
    throw createStorageError(
      'Failed to delete post',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, postId: id }
    )
  }
}

// Enhanced User operations with validation and error handling
export async function createUser(name: string, email: string): Promise<User> {
  try {
    const data = await readData()
    
    const user: User = {
      id: randomUUID(),
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Validate user data
    const validationResult = userSchema.safeParse(user)
    if (!validationResult.success) {
      throw createStorageError(
        'User validation failed',
        STORAGE_ERROR_CODES.VALIDATION_FAILED,
        { errors: validationResult.error.errors }
      )
    }
    
    data.users[user.id] = user
    await writeData(data)
    
    return user
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to create user',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message }
    )
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const data = await readData()
    return data.users[id] || null
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve user by ID',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, userId: id }
    )
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const data = await readData()
    const existingUser = data.users[id]
    
    if (!existingUser) {
      return null
    }
    
    const updatedUser = {
      ...existingUser,
      ...updates,
      id: existingUser.id, // Prevent ID changes
      createdAt: existingUser.createdAt, // Prevent creation date changes
      updatedAt: new Date()
    }
    
    // Validate updated user
    const validationResult = userSchema.safeParse(updatedUser)
    if (!validationResult.success) {
      throw createStorageError(
        'User update validation failed',
        STORAGE_ERROR_CODES.VALIDATION_FAILED,
        { errors: validationResult.error.errors }
      )
    }
    
    data.users[id] = updatedUser
    await writeData(data)
    
    return updatedUser
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to update user',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, userId: id }
    )
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const data = await readData()
    if (data.users[id]) {
      delete data.users[id]
      await writeData(data)
      return true
    }
    return false
  } catch (error) {
    throw createStorageError(
      'Failed to delete user',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, userId: id }
    )
  }
}

export async function getUserPosts(userId: string, options: { 
  limit?: number
  offset?: number
} = {}): Promise<Post[]> {
  try {
    const data = await readData()
    let userPosts = Object.values(data.posts)
      .filter(post => post.authorId === userId)
    
    // Sort by creation date (newest first)
    userPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Apply pagination
    const { offset = 0, limit } = options
    if (limit) {
      userPosts = userPosts.slice(offset, offset + limit)
    }
    
    return userPosts
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve user posts',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, userId }
    )
  }
}

// Utility functions for backup, migration, and integrity checking
export async function backup(): Promise<boolean> {
  try {
    await createBackup()
    return true
  } catch (error) {
    return false
  }
}

export async function migrate(fromVersion: number, toVersion: number): Promise<boolean> {
  try {
    const data = await readData()
    
    if (data.version === toVersion) {
      return true // Already at target version
    }
    
    // Future migration logic would go here
    // For now, just update version
    data.version = toVersion
    await writeData(data)
    
    return true
  } catch (error) {
    throw createStorageError(
      'Migration failed',
      STORAGE_ERROR_CODES.MIGRATION_FAILED,
      { originalError: (error as Error).message, fromVersion, toVersion }
    )
  }
}

export async function validateIntegrity(): Promise<boolean> {
  try {
    const data = await readData()
    
    // Validate all posts
    for (const post of Object.values(data.posts)) {
      const result = postSchema.safeParse(post)
      if (!result.success) {
        return false
      }
    }
    
    // Validate all users
    for (const user of Object.values(data.users)) {
      const result = userSchema.safeParse(user)
      if (!result.success) {
        return false
      }
    }
    
    // Validate all comments
    for (const comment of Object.values(data.comments)) {
      const result = commentSchema.safeParse(comment)
      if (!result.success) {
        return false
      }
    }
    
    return true
  } catch (error) {
    return false
  }
}

export async function getStats(): Promise<{ totalPosts: number; totalUsers: number }> {
  try {
    const data = await readData()
    return {
      totalPosts: Object.keys(data.posts).length,
      totalUsers: Object.keys(data.users).length
    }
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve stats',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message }
    )
  }
}

// Reaction operations
export async function toggleReaction(postId: string, userId: string): Promise<{ isLiked: boolean; reactionCount: number }> {
  try {
    const data = await readData()
    
    // Check if post exists
    if (!data.posts[postId]) {
      throw createStorageError(
        'Post not found',
        'POST_NOT_FOUND',
        { postId }
      )
    }

    // Generate reaction key
    const reactionKey = `${postId}_${userId}`
    const existingReaction = data.reactions[reactionKey]

    if (existingReaction) {
      // Remove reaction
      delete data.reactions[reactionKey]
      data.posts[postId].reactionCount = Math.max(0, data.posts[postId].reactionCount - 1)
      await writeData(data)
      return { isLiked: false, reactionCount: data.posts[postId].reactionCount }
    } else {
      // Add reaction
      const reaction: Reaction = {
        id: randomUUID(),
        type: 'heart',
        postId,
        userId,
        createdAt: new Date()
      }

      // Validate reaction data
      const validationResult = reactionSchema.safeParse(reaction)
      if (!validationResult.success) {
        throw createStorageError(
          'Reaction validation failed',
          STORAGE_ERROR_CODES.VALIDATION_FAILED,
          { errors: validationResult.error.errors }
        )
      }

      data.reactions[reactionKey] = reaction
      data.posts[postId].reactionCount += 1
      await writeData(data)
      return { isLiked: true, reactionCount: data.posts[postId].reactionCount }
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to toggle reaction',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, postId, userId }
    )
  }
}

export async function getUserReaction(postId: string, userId: string): Promise<Reaction | null> {
  try {
    const data = await readData()
    const reactionKey = `${postId}_${userId}`
    return data.reactions[reactionKey] || null
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve user reaction',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, postId, userId }
    )
  }
}

export async function getPostReactions(postId: string): Promise<Reaction[]> {
  try {
    const data = await readData()
    return Object.values(data.reactions).filter((reaction: any) => reaction.postId === postId)
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve post reactions',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, postId }
    )
  }
}

// Comment operations
export async function createComment(
  postId: string, 
  content: string, 
  authorId: string, 
  authorName: string
): Promise<Comment> {
  try {
    const data = await readData()
    
    // Check if post exists
    if (!data.posts[postId]) {
      throw createStorageError(
        'Post not found',
        'POST_NOT_FOUND',
        { postId }
      )
    }

    const comment: Comment = {
      id: randomUUID(),
      content: content.trim(),
      postId,
      authorId,
      authorName,
      createdAt: new Date()
    }
    
    // Validate comment data
    const validationResult = commentSchema.safeParse(comment)
    if (!validationResult.success) {
      throw createStorageError(
        'Comment validation failed',
        STORAGE_ERROR_CODES.VALIDATION_FAILED,
        { errors: validationResult.error.errors }
      )
    }
    
    // Store comment and update post comment count atomically
    data.comments[comment.id] = comment
    data.posts[postId].commentCount += 1
    await writeData(data)
    
    return comment
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    throw createStorageError(
      'Failed to create comment',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, postId, authorId }
    )
  }
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const data = await readData()
    const comments = Object.values(data.comments)
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return comments
  } catch (error) {
    throw createStorageError(
      'Failed to retrieve comments for post',
      STORAGE_ERROR_CODES.FILE_NOT_FOUND,
      { originalError: (error as Error).message, postId }
    )
  }
}

export async function deleteComment(id: string): Promise<boolean> {
  try {
    const data = await readData()
    const comment = data.comments[id]
    
    if (!comment) {
      return false
    }

    // Remove comment and update post comment count atomically
    delete data.comments[id]
    if (data.posts[comment.postId]) {
      data.posts[comment.postId].commentCount = Math.max(0, data.posts[comment.postId].commentCount - 1)
    }
    
    await writeData(data)
    return true
  } catch (error) {
    throw createStorageError(
      'Failed to delete comment',
      STORAGE_ERROR_CODES.WRITE_FAILED,
      { originalError: (error as Error).message, commentId: id }
    )
  }
}

// Clear cache function for testing
export function clearCache(): void {
  dataCache = null
  cacheTimestamp = 0
}

// JSONFileStorage class implementing IStorage interface
export class JSONFileStorage implements IStorage {
  async createPost(content: string, authorId: string, authorName: string, mood?: Post['mood']): Promise<Post> {
    return createPost(content, authorId, authorName, mood)
  }

  async getPosts(options?: { limit?: number; offset?: number; sortBy?: string }): Promise<Post[]> {
    return getPosts(options as any)
  }

  async getPostById(id: string): Promise<Post | null> {
    return getPostById(id)
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    return updatePost(id, updates)
  }

  async deletePost(id: string): Promise<boolean> {
    return deletePost(id)
  }

  async createUser(name: string, email: string): Promise<User> {
    return createUser(name, email)
  }

  async getUserById(id: string): Promise<User | null> {
    return getUserById(id)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return updateUser(id, updates)
  }

  async deleteUser(id: string): Promise<boolean> {
    return deleteUser(id)
  }

  async backup(): Promise<boolean> {
    return backup()
  }

  async migrate(fromVersion: number, toVersion: number): Promise<boolean> {
    return migrate(fromVersion, toVersion)
  }

  async validateIntegrity(): Promise<boolean> {
    return validateIntegrity()
  }

  async getStats(): Promise<{ totalPosts: number; totalUsers: number }> {
    return getStats()
  }

  async toggleReaction(postId: string, userId: string): Promise<{ isLiked: boolean; reactionCount: number }> {
    return toggleReaction(postId, userId)
  }

  async getUserReaction(postId: string, userId: string): Promise<Reaction | null> {
    return getUserReaction(postId, userId)
  }

  async getPostReactions(postId: string): Promise<Reaction[]> {
    return getPostReactions(postId)
  }

  async createComment(postId: string, content: string, authorId: string, authorName: string): Promise<Comment> {
    return createComment(postId, content, authorId, authorName)
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return getCommentsByPostId(postId)
  }

  async deleteComment(id: string): Promise<boolean> {
    return deleteComment(id)
  }

  async getUserPosts(userId: string, options?: { limit?: number; offset?: number }): Promise<Post[]> {
    return getUserPosts(userId, options)
  }
}

// Default storage instance
export const storage = new JSONFileStorage()