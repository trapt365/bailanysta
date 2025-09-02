import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { validateEnv, getEnvConfig } from './middleware/envValidation'

// Validate environment on server startup
validateEnv()

// Create context type
export interface Context {
  env: ReturnType<typeof getEnvConfig>
}

// Initialize tRPC
const t = initTRPC.context<Context>().create()

// Export tRPC utilities
export const router = t.router
export const publicProcedure = t.procedure

// Create a simple middleware for error handling
export const errorHandlerMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    console.error('tRPC error:', error)
    throw error
  }
})

export const protectedProcedure = publicProcedure.use(errorHandlerMiddleware)