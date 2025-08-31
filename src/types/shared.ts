// Shared types between client and server
// Post-related types
export interface Post {
  id: string;                    // UUID
  content: string;               // max 280 characters
  authorId: string;              // user reference
  authorName: string;            // denormalized for performance
  createdAt: Date;
  updatedAt: Date;
  mood?: 'Happy' | 'Thoughtful' | 'Excited' | 'Contemplative' | 'Energetic';
  hashtags: string[];            // extracted from content
  reactionCount: number;         // denormalized counter
  commentCount: number;          // denormalized counter
}

// User-related types
export interface User {
  id: string;                    // Unique user identifier (UUID)
  username: string;              // Display name for posts and interactions
  email?: string;                // Optional email for future authentication
  bio?: string;                  // Optional profile description
  joinedAt: Date;               // Account creation timestamp
  postCount: number;            // Denormalized post count
  preferences: UserPreferences; // Theme and display preferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru';
}

export interface UpdateUserInput {
  username?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  joinedAt: Date;
  postCount: number;
}

export interface GetUserPostsInput {
  userId: string;
  limit?: number;
  offset?: number;
}

// API input/output types
export interface CreatePostInput {
  content: string;
  mood?: Post['mood'];
}

export interface CreatePostOutput {
  post: Post;
  success: boolean;
}

// Form state types
export interface PostFormData {
  content: string;
  mood?: Post['mood'];
}

// UI component types
export interface CharacterCounterProps {
  current: number;
  max: number;
}

// Reaction-related types
export interface Reaction {
  id: string;                    // Unique reaction identifier
  type: 'heart';                 // Reaction type (currently only 'heart')
  postId: string;                // Target post reference
  userId: string;                // User who reacted
  createdAt: Date;               // Reaction timestamp
}

export interface ReactionToggleInput {
  postId: string;
}

export interface ReactionToggleOutput {
  isLiked: boolean;
  reactionCount: number;
}

// Comment-related types
export interface Comment {
  id: string;                    // Unique comment identifier
  content: string;               // Comment text (max 140 characters)
  postId: string;                // Reference to parent post
  authorId: string;              // Comment author reference
  authorName: string;            // Denormalized author name
  createdAt: Date;               // Comment timestamp
}

export interface CreateCommentInput {
  postId: string;
  content: string;
}

export interface CreateCommentOutput {
  comment: Comment;
  success: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}