import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers'
import { Context } from '@/server/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (): Context => ({}),
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`)
    },
  })

export { handler as GET, handler as POST }