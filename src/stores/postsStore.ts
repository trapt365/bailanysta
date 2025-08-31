import { create } from 'zustand'
import { Post } from '@/types/shared'

interface PostsState {
  posts: Post[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setPosts: (posts: Post[]) => void
  addOptimisticPost: (post: Post) => void
  removeOptimisticPost: (postId: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearPosts: () => void
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  setPosts: (posts) =>
    set({ posts: posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) }),

  addOptimisticPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts]
    })),

  removeOptimisticPost: (postId) =>
    set((state) => ({
      posts: state.posts.filter(p => p.id !== postId)
    })),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setError: (error) =>
    set({ error }),

  clearPosts: () =>
    set({ posts: [], error: null, isLoading: false })
}))

// Optimistic update helper
export const createOptimisticPost = (content: string, mood?: Post['mood']): Post => {
  return {
    id: `optimistic-${Date.now()}`,
    content,
    authorId: 'mock-user-id',
    authorName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    mood,
    hashtags: content.match(/#[\w]+/g)?.map(tag => tag.slice(1).toLowerCase()) || [],
    reactionCount: 0,
    commentCount: 0
  }
}