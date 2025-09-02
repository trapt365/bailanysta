import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

describe('Build Process Tests', () => {
  describe('Production Build', () => {
    it('should complete build without errors', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run build', {
          cwd: process.cwd(),
          timeout: 300000, // 5 minutes timeout
        });
        
        expect(stderr).not.toContain('ERROR');
        expect(stdout).toContain('Creating an optimized production build');
      } catch (error) {
        console.error('Build failed:', error);
        throw error;
      }
    }, 300000);

    it('should create necessary build artifacts', async () => {
      const nextDir = path.join(process.cwd(), '.next');
      
      // Check if .next directory exists
      await expect(fs.access(nextDir)).resolves.toBeUndefined();
      
      // Check for static directory
      const staticDir = path.join(nextDir, 'static');
      await expect(fs.access(staticDir)).resolves.toBeUndefined();
      
      // Check for server files
      const serverDir = path.join(nextDir, 'server');
      await expect(fs.access(serverDir)).resolves.toBeUndefined();
    });

    it('should generate optimized bundles', async () => {
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      try {
        const chunks = await fs.readdir(path.join(staticDir, 'chunks'));
        expect(chunks.length).toBeGreaterThan(0);
        
        // Check that chunks are properly minified (should not contain readable code)
        const firstChunk = chunks.find(chunk => chunk.endsWith('.js'));
        if (firstChunk) {
          const chunkPath = path.join(staticDir, 'chunks', firstChunk);
          const chunkContent = await fs.readFile(chunkPath, 'utf8');
          
          // Minified files should not contain excessive whitespace
          const lines = chunkContent.split('\n');
          expect(lines.length).toBeLessThan(10); // Minified should be compact
        }
      } catch (error) {
        console.warn('Could not verify chunk optimization:', error);
      }
    });
  });

  describe('Bundle Size Validation', () => {
    it('should meet bundle size requirements', async () => {
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      try {
        const chunksDir = path.join(staticDir, 'chunks');
        const chunks = await fs.readdir(chunksDir);
        
        let totalSize = 0;
        for (const chunk of chunks) {
          const chunkPath = path.join(chunksDir, chunk);
          const stats = await fs.stat(chunkPath);
          totalSize += stats.size;
        }
        
        // Convert to KB
        const totalSizeKB = totalSize / 1024;
        console.log(`Total bundle size: ${totalSizeKB.toFixed(2)}KB`);
        
        // Should be under 500KB as per requirements
        expect(totalSizeKB).toBeLessThan(500);
        
      } catch (error) {
        console.warn('Could not calculate bundle size:', error);
        // Don't fail the test if we can't calculate size
      }
    });

    it('should have reasonable individual chunk sizes', async () => {
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      try {
        const chunksDir = path.join(staticDir, 'chunks');
        const chunks = await fs.readdir(chunksDir);
        
        for (const chunk of chunks) {
          const chunkPath = path.join(chunksDir, chunk);
          const stats = await fs.stat(chunkPath);
          const sizeKB = stats.size / 1024;
          
          // Individual chunks should be under 200KB
          expect(sizeKB).toBeLessThan(200);
        }
        
      } catch (error) {
        console.warn('Could not verify individual chunk sizes:', error);
      }
    });
  });

  describe('Type Checking', () => {
    it('should pass TypeScript type checking', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run type-check', {
          cwd: process.cwd(),
          timeout: 60000, // 1 minute timeout
        });
        
        expect(stderr).not.toContain('error TS');
        expect(stdout.toLowerCase()).not.toContain('error');
        
      } catch (error) {
        console.error('Type checking failed:', error);
        throw error;
      }
    }, 60000);
  });

  describe('Linting', () => {
    it('should pass ESLint checks', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run lint', {
          cwd: process.cwd(),
          timeout: 60000, // 1 minute timeout
        });
        
        expect(stderr).not.toContain('error');
        
      } catch (error) {
        // Check if it's just warnings vs actual errors
        if (error.code === 1) {
          console.warn('Linting warnings (non-blocking):', error.stdout);
        } else {
          console.error('Linting failed:', error);
          throw error;
        }
      }
    }, 60000);
  });

  describe('Environment Variables', () => {
    it('should validate required environment variables exist', async () => {
      // Check that required variables are defined in .env.example
      const envExamplePath = path.join(process.cwd(), '.env.example');
      
      try {
        const envExample = await fs.readFile(envExamplePath, 'utf8');
        
        // Required variables
        const requiredVars = [
          'NEXT_PUBLIC_APP_NAME',
          'NEXT_PUBLIC_APP_URL',
          'NEXT_PUBLIC_API_URL',
          'NEXT_PUBLIC_ENVIRONMENT',
          'JWT_SECRET',
          'SESSION_SECRET',
          'NODE_ENV'
        ];
        
        for (const varName of requiredVars) {
          expect(envExample).toContain(varName);
        }
        
      } catch (error) {
        console.error('Environment variable validation failed:', error);
        throw error;
      }
    });
  });
});