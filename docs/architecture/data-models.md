# Data Models

### Core Data Models

#### Post

**Purpose:** Represents user-generated content in the social network feed

**Key Attributes:**
- id: string - Unique post identifier (UUID)
- content: string - Post text content (max 280 characters)
- authorId: string - Reference to user who created the post
- authorName: string - Denormalized author name for performance
- createdAt: Date - Timestamp of post creation
- updatedAt: Date - Timestamp of last modification
- mood?: string - Optional mood indicator (Happy, Thoughtful, Excited, etc.)
- hashtags: string[] - Extracted hashtags from content
- reactionCount: number - Denormalized reaction count
- commentCount: number - Denormalized comment count

##### TypeScript Interface

```typescript
interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  mood?: 'Happy' | 'Thoughtful' | 'Excited' | 'Contemplative' | 'Energetic';
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
}
```

##### Relationships
- One-to-many with Comments (post.id → comment.postId)
- One-to-many with Reactions (post.id → reaction.postId)
- Many-to-one with User (post.authorId → user.id)

#### User

**Purpose:** Represents platform users with authentication and profile information

**Key Attributes:**
- id: string - Unique user identifier (UUID)
- username: string - Display name for posts and interactions
- email?: string - Optional email for future authentication
- bio?: string - Optional profile description
- joinedAt: Date - Account creation timestamp
- postCount: number - Denormalized post count
- preferences: UserPreferences - Theme and display preferences

##### TypeScript Interface

```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  joinedAt: Date;
  postCount: number;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru';
}
```

##### Relationships
- One-to-many with Posts (user.id → post.authorId)
- One-to-many with Comments (user.id → comment.authorId)
- One-to-many with Reactions (user.id → reaction.userId)

#### Comment

**Purpose:** User responses to posts enabling threaded discussions

**Key Attributes:**
- id: string - Unique comment identifier
- content: string - Comment text (max 140 characters)
- postId: string - Reference to parent post
- authorId: string - Comment author reference
- authorName: string - Denormalized author name
- createdAt: Date - Comment timestamp

##### TypeScript Interface

```typescript
interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}
```

##### Relationships
- Many-to-one with Post (comment.postId → post.id)
- Many-to-one with User (comment.authorId → user.id)

#### Reaction

**Purpose:** User emotional responses to posts (heart/like system)

**Key Attributes:**
- id: string - Unique reaction identifier
- type: string - Reaction type (currently only 'heart')
- postId: string - Target post reference
- userId: string - User who reacted
- createdAt: Date - Reaction timestamp

##### TypeScript Interface

```typescript
interface Reaction {
  id: string;
  type: 'heart';
  postId: string;
  userId: string;
  createdAt: Date;
}
```

##### Relationships
- Many-to-one with Post (reaction.postId → post.id)
- Many-to-one with User (reaction.userId → user.id)