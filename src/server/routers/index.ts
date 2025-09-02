import { router } from '../trpc'
import { postsRouter } from './posts'
import { reactionsRouter } from './reactions'
import { commentsRouter } from './comments'
import { usersRouter } from './users'
import { searchRouter } from './search'

export const appRouter = router({
  posts: postsRouter,
  reactions: reactionsRouter,
  comments: commentsRouter,
  users: usersRouter,
  search: searchRouter
})

export type AppRouter = typeof appRouter