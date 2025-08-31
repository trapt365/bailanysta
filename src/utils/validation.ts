import { z } from 'zod'

// Post validation schemas
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post cannot be empty')
    .max(280, 'Post cannot exceed 280 characters')
    .trim(),
  mood: z
    .enum(['Happy', 'Thoughtful', 'Excited', 'Contemplative', 'Energetic'])
    .optional(),
})

export const postSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(280),
  authorId: z.string().uuid(),
  authorName: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  mood: z
    .enum(['Happy', 'Thoughtful', 'Excited', 'Contemplative', 'Energetic'])
    .optional(),
  hashtags: z.array(z.string()),
  reactionCount: z.number().min(0),
  commentCount: z.number().min(0),
})

// User validation schemas
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'ru']),
})

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(50),
  email: z.string().email().optional(),
  bio: z.string().max(200).optional(),
  joinedAt: z.date(),
  postCount: z.number().min(0),
  preferences: userPreferencesSchema,
})

export const updateUserSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  bio: z.string().max(200).optional(),
  preferences: userPreferencesSchema.partial().optional(),
})

export const getUserPostsSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
})

// Reaction validation schemas
export const reactionToggleSchema = z.object({
  postId: z.string().uuid('Invalid post ID format'),
})

export const reactionSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('heart'),
  postId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
})

// Comment validation schemas
export const createCommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID format'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(140, 'Comment cannot exceed 140 characters')
    .trim(),
})

export const commentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(140),
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string().min(1),
  createdAt: z.date(),
})

// Export types for use in components
export type CreatePostInput = z.infer<typeof createPostSchema>
export type PostData = z.infer<typeof postSchema>
export type UserData = z.infer<typeof userSchema>
export type ReactionToggleInput = z.infer<typeof reactionToggleSchema>
export type ReactionData = z.infer<typeof reactionSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CommentData = z.infer<typeof commentSchema>

// Validation helper functions
export const validatePostContent = (content: string): string[] => {
  const errors: string[] = []
  
  if (!content.trim()) {
    errors.push('Post cannot be empty')
  }
  
  if (content.length > 280) {
    errors.push('Post cannot exceed 280 characters')
  }
  
  return errors
}

// Character counting utility
export const getCharacterCount = (text: string): number => text.length

// Hashtag extraction utility
export const extractHashtags = (content: string): string[] => {
  const hashtags = content.match(/#[\w]+/g) || []
  return hashtags.map(tag => tag.slice(1).toLowerCase())
}

// Comment validation utility
export const validateCommentContent = (content: string): string[] => {
  const errors: string[] = []
  
  if (!content.trim()) {
    errors.push('Comment cannot be empty')
  }
  
  if (content.length > 140) {
    errors.push('Comment cannot exceed 140 characters')
  }
  
  return errors
}

// User profile validation utilities
export const validateUsername = (username: string): string[] => {
  const errors: string[] = []
  
  if (!username.trim()) {
    errors.push('Username cannot be empty')
  }
  
  if (username.length > 50) {
    errors.push('Username cannot exceed 50 characters')
  }
  
  return errors
}

export const validateBio = (bio: string): string[] => {
  const errors: string[] = []
  
  if (bio.length > 200) {
    errors.push('Bio cannot exceed 200 characters')
  }
  
  return errors
}