import { NextApiRequest, NextApiResponse } from 'next';
import { getEnvConfig } from '../../server/middleware/envValidation';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  checks: {
    environment: boolean;
    database: boolean;
    api: boolean;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse | { error: string }>
) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const env = getEnvConfig();
    const startTime = Date.now();

    // Perform health checks
    const checks = {
      environment: true, // Environment validation passed if we get here
      database: await checkDatabase(),
      api: true, // API is responding if this handler is running
    };

    const allChecksPass = Object.values(checks).every(check => check === true);

    const response: HealthCheckResponse = {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      checks,
    };

    const statusCode = allChecksPass ? 200 : 503;
    
    // Add cache headers to prevent caching of health checks
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(500).json({
      error: 'Health check failed',
    });
  }
}

/**
 * Check database connectivity and basic operations
 */
async function checkDatabase(): Promise<boolean> {
  try {
    // For JSON storage, check if we can access the data directory
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists and is accessible
    await fs.access(dataDir);
    
    // Try to read the main data file (or create if it doesn't exist)
    const dataFile = path.join(dataDir, 'bailanysta.json');
    try {
      await fs.access(dataFile);
    } catch {
      // Create the file if it doesn't exist
      await fs.writeFile(dataFile, JSON.stringify({
        users: {},
        posts: {},
        comments: {},
        reactions: {}
      }, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}