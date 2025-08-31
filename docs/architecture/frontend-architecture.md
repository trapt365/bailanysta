# Frontend Architecture

### Component Architecture

#### Component Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, Modal)
│   ├── forms/           # Form components (CreatePost, EditProfile)
│   ├── feed/            # Feed-related components (PostCard, PostFeed)
│   ├── user/            # User-related components (Profile, Avatar)
│   └── layout/          # Layout components (Navigation, Header)
├── pages/               # Next.js pages and routing
│   ├── index.tsx        # Main feed page
│   ├── profile/         # User profile pages
│   │   └── [userId].tsx # Dynamic profile routes
│   ├── search/          # Search results
│   └── api/             # API routes (tRPC)
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication logic
│   ├── usePosts.ts      # Post data management
│   └── useTheme.ts      # Theme switching
├── stores/              # Zustand state stores
│   ├── authStore.ts     # User authentication state
│   ├── uiStore.ts       # UI state (modals, theme)
│   └── postsStore.ts    # Post cache and optimistic updates
├── services/            # API client services
│   ├── api.ts           # tRPC client setup
│   └── storage.ts       # Local storage utilities
├── utils/               # Utility functions
│   ├── validation.ts    # Zod schemas
│   ├── hashtags.ts      # Hashtag extraction
│   └── formatting.ts    # Date/text formatting
└── styles/              # Global styles and themes
    ├── globals.css      # Global Tailwind styles
    └── themes.ts        # Theme configuration
```

#### Component Template

```typescript
import React, { useState } from 'react';
import { Post } from '@/types/shared';
import { trpc } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface PostCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false); // TODO: Get from user reactions
  const [localReactionCount, setLocalReactionCount] = useState(post.reactionCount);

  const toggleReaction = trpc.reactions.toggle.useMutation({
    onMutate: () => {
      // Optimistic update
      setIsLiked(!isLiked);
      setLocalReactionCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLocalReactionCount(prev => isLiked ? prev + 1 : prev - 1);
    },
    onSuccess: (data) => {
      // Confirm optimistic update with server state
      setIsLiked(data.isLiked);
      setLocalReactionCount(data.reactionCount);
    },
  });

  const handleReaction = () => {
    if (!user) return;
    toggleReaction.mutate({ postId: post.id });
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Post header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {post.authorName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{post.authorName}</h3>
            <time className="text-sm text-gray-500 dark:text-gray-400">
              {new Intl.RelativeTimeFormat().format(
                Math.floor((new Date(post.createdAt).getTime() - Date.now()) / (1000 * 60)), 
                'minute'
              )}
            </time>
          </div>
        </div>
        {post.mood && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
            {post.mood}
          </span>
        )}
      </header>

      {/* Post content */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
          {post.content}
        </p>
        {post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map(hashtag => (
              <button
                key={hashtag}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                onClick={() => {/* TODO: Navigate to hashtag feed */}}
              >
                #{hashtag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post actions */}
      <footer className="flex items-center space-x-6 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleReaction}
          disabled={!user || toggleReaction.isLoading}
          className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {isLiked ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
          <span className="text-sm">{localReactionCount}</span>
        </button>

        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
          <span className="text-sm">{post.commentCount} comments</span>
        </button>
      </footer>
    </article>
  );
};
```

### State Management Architecture

#### State Structure

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// UI Store
interface UIState {
  theme: 'light' | 'dark' | 'system';
  isCreatePostModalOpen: boolean;
  isProfileEditModalOpen: boolean;
  currentRoute: string;
  setTheme: (theme: UIState['theme']) => void;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  toggleProfileEditModal: () => void;
}

// Posts Store (for optimistic updates and caching)
interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  optimisticPosts: Post[]; // For immediate UI updates
  addOptimisticPost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  confirmOptimisticPost: (tempId: string, post: Post) => void;
  revertOptimisticPost: (tempId: string) => void;
}
```

#### State Management Patterns

- **Optimistic Updates:** Immediate UI feedback for user actions before server confirmation
- **Error Boundaries:** Graceful error handling with user-friendly fallbacks
- **Persistence:** Theme and user preferences saved to localStorage
- **Computed Values:** Derived state for filtered posts, user statistics
- **Async Actions:** Promise-based actions for API calls with loading states
- **State Normalization:** Efficient updates for nested data structures

### Routing Architecture

#### Route Organization

```
pages/
├── index.tsx                 # Main feed (/)
├── profile/
│   ├── index.tsx            # Current user profile (/profile)
│   └── [userId].tsx         # User profile (/profile/[userId])
├── search/
│   └── index.tsx            # Search results (/search?q=...)
├── hashtag/
│   └── [tag].tsx            # Hashtag feed (/hashtag/[tag])
├── api/                     # API routes
│   ├── trpc/
│   │   └── [trpc].ts        # tRPC handler
│   └── auth/
│       ├── login.ts         # Authentication endpoints
│       └── register.ts
├── _app.tsx                 # App wrapper with providers
├── _document.tsx            # HTML document structure
└── 404.tsx                  # Custom 404 page
```

### Frontend Services Layer

#### API Client Setup

```typescript
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../pages/api/trpc/[trpc]';
import { useAuthStore } from '@/stores/authStore';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers: () => {
            const { user } = useAuthStore.getState();
            return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: any) => {
              if (error?.data?.httpStatus === 401) return false;
              return failureCount < 3;
            },
          },
        },
      },
    };
  },
  ssr: false, // Disable SSR for MVP simplicity
});
```