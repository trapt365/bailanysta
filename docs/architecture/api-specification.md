# API Specification

### tRPC Router Definitions

```typescript
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/setup';

// Input schemas
const createPostSchema = z.object({
  content: z.string().min(1).max(280),
  mood: z.enum(['Happy', 'Thoughtful', 'Excited', 'Contemplative', 'Energetic']).optional(),
});

const toggleReactionSchema = z.object({
  postId: z.string().uuid(),
});

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(140),
});

// Main API router
export const appRouter = router({
  // Posts
  posts: router({
    getAll: publicProcedure
      .query(async () => {
        // Returns paginated posts with reactions/comments
        return await postService.getAllPosts();
      }),

    create: protectedProcedure
      .input(createPostSchema)
      .mutation(async ({ input, ctx }) => {
        return await postService.createPost({
          ...input,
          authorId: ctx.user.id,
          authorName: ctx.user.username,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(280),
      }))
      .mutation(async ({ input, ctx }) => {
        return await postService.updatePost(input.id, input, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        return await postService.deletePost(input.id, ctx.user.id);
      }),

    getByHashtag: publicProcedure
      .input(z.object({ hashtag: z.string() }))
      .query(async ({ input }) => {
        return await postService.getPostsByHashtag(input.hashtag);
      }),
  }),

  // Reactions
  reactions: router({
    toggle: protectedProcedure
      .input(toggleReactionSchema)
      .mutation(async ({ input, ctx }) => {
        return await reactionService.toggleReaction({
          postId: input.postId,
          userId: ctx.user.id,
          type: 'heart',
        });
      }),
  }),

  // Comments
  comments: router({
    create: protectedProcedure
      .input(createCommentSchema)
      .mutation(async ({ input, ctx }) => {
        return await commentService.createComment({
          ...input,
          authorId: ctx.user.id,
          authorName: ctx.user.username,
        });
      }),

    getByPost: publicProcedure
      .input(z.object({ postId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await commentService.getCommentsByPost(input.postId);
      }),
  }),

  // Users
  users: router({
    me: protectedProcedure
      .query(async ({ ctx }) => {
        return ctx.user;
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        username: z.string().min(1).max(50).optional(),
        bio: z.string().max(160).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await userService.updateUser(ctx.user.id, input);
      }),

    getProfile: publicProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await userService.getUserProfile(input.userId);
      }),
  }),

  // Search
  search: router({
    posts: publicProcedure
      .input(z.object({ 
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return await searchService.searchPosts(input.query, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

## External APIs

Based on the PRD requirements focusing on MVP development with minimal external dependencies, **no external APIs are required for the initial implementation**. The application will function entirely with local data storage and built-in functionality.

**Future Integration Candidates:**
- GitHub API for social login (Epic 3 enhancement)
- Web Push API for notifications (post-MVP)
- Content moderation APIs (scaling phase)