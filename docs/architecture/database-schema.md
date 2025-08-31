# Database Schema

### JSON Storage Schema (MVP Phase)

```json
{
  "users": {
    "user-uuid-1": {
      "id": "user-uuid-1",
      "username": "john_doe",
      "email": "john@example.com",
      "bio": "Passionate about authentic social connections",
      "joinedAt": "2025-08-31T12:00:00Z",
      "postCount": 5,
      "preferences": {
        "theme": "dark",
        "language": "en"
      }
    }
  },
  "posts": {
    "post-uuid-1": {
      "id": "post-uuid-1",
      "content": "Just built my first social network! Excited to see where this goes 🚀 #MVP #coding",
      "authorId": "user-uuid-1",
      "authorName": "john_doe",
      "createdAt": "2025-08-31T12:30:00Z",
      "updatedAt": "2025-08-31T12:30:00Z",
      "mood": "Excited",
      "hashtags": ["MVP", "coding"],
      "reactionCount": 3,
      "commentCount": 1
    }
  },
  "comments": {
    "comment-uuid-1": {
      "id": "comment-uuid-1",
      "content": "Amazing work! Can't wait to try it out 👏",
      "postId": "post-uuid-1",
      "authorId": "user-uuid-2",
      "authorName": "jane_smith",
      "createdAt": "2025-08-31T12:45:00Z"
    }
  },
  "reactions": {
    "reaction-uuid-1": {
      "id": "reaction-uuid-1",
      "type": "heart",
      "postId": "post-uuid-1",
      "userId": "user-uuid-2",
      "createdAt": "2025-08-31T12:35:00Z"
    }
  }
}
```

### Future Vercel KV Schema (Migration Path)

```typescript
// Redis key patterns for Vercel KV
const KEYS = {
  users: (id: string) => `user:${id}`,
  posts: (id: string) => `post:${id}`,
  comments: (postId: string) => `comments:${postId}`,
  reactions: (postId: string) => `reactions:${postId}`,
  userPosts: (userId: string) => `user:${userId}:posts`,
  hashtagPosts: (hashtag: string) => `hashtag:${hashtag}:posts`,
  feed: 'global:feed',
} as const;

// Indexes for efficient querying
const INDEXES = {
  postsByTimestamp: 'idx:posts:timestamp',
  postsByHashtag: (hashtag: string) => `idx:posts:hashtag:${hashtag}`,
  postsByUser: (userId: string) => `idx:posts:user:${userId}`,
} as const;
```

### Future PostgreSQL Schema (Scaling Phase)

```sql
-- Future migration to PostgreSQL/Vercel Postgres
-- This schema represents the target structure for scaling

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{"theme": "light", "language": "en"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL CHECK (length(content) <= 280),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(50) NOT NULL, -- Denormalized for performance
    mood VARCHAR(20),
    hashtags TEXT[] DEFAULT '{}',
    reaction_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL CHECK (length(content) <= 140),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(50) NOT NULL, -- Denormalized for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(10) NOT NULL DEFAULT 'heart',
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id) -- Prevent duplicate reactions
);

-- Indexes for performance
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_hashtags ON posts USING gin(hashtags);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- Triggers for maintaining counters
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
```