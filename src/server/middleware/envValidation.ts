import { z } from 'zod';

const envSchema = z.object({
  // Frontend environment variables
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'App name is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('Valid app URL is required'),
  NEXT_PUBLIC_API_URL: z.string().url('Valid API URL is required'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'production', 'test']),

  // Backend environment variables
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Optional Vercel variables
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_KV_REST_API_URL: z.string().optional(),
  VERCEL_KV_REST_API_TOKEN: z.string().optional(),
  VERCEL_BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Development tools
  ANALYZE_BUNDLE: z.string().optional(),
  DEBUG_MODE: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;

/**
 * Validates environment variables at application startup
 * @throws {Error} If environment variables are invalid
 */
export function validateEnv(): EnvVars {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional production-specific validation
    if (env.NODE_ENV === 'production') {
      if (!env.JWT_SECRET || env.JWT_SECRET === 'your-super-secret-jwt-key-here') {
        throw new Error('Production JWT_SECRET must be set to a secure value');
      }
      
      if (!env.SESSION_SECRET || env.SESSION_SECRET === 'your-session-secret-here') {
        throw new Error('Production SESSION_SECRET must be set to a secure value');
      }

      if (env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
        throw new Error('NEXT_PUBLIC_ENVIRONMENT must be "production" in production');
      }

      if (env.NEXT_PUBLIC_APP_URL === 'http://localhost:3000') {
        throw new Error('NEXT_PUBLIC_APP_URL must be set to production URL');
      }
    }

    console.log(`✅ Environment validation passed for ${env.NODE_ENV} environment`);
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  - ${(error as Error).message}`);
    }
    throw new Error('Environment validation failed');
  }
}

/**
 * Get validated environment configuration
 * Cached after first validation
 */
let cachedEnv: EnvVars | null = null;

export function getEnvConfig(): EnvVars {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Environment-specific configuration helper
 */
export const envConfig = {
  isDevelopment: () => getEnvConfig().NODE_ENV === 'development',
  isProduction: () => getEnvConfig().NODE_ENV === 'production',
  isTest: () => getEnvConfig().NODE_ENV === 'test',
  
  getAppUrl: () => getEnvConfig().NEXT_PUBLIC_APP_URL,
  getApiUrl: () => getEnvConfig().NEXT_PUBLIC_API_URL,
  
  getJwtSecret: () => getEnvConfig().JWT_SECRET,
  getSessionSecret: () => getEnvConfig().SESSION_SECRET,
  
  hasVercelIntegration: () => {
    const env = getEnvConfig();
    return !!(env.VERCEL_KV_REST_API_URL && env.VERCEL_KV_REST_API_TOKEN);
  },
};