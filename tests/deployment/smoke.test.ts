import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Deployment Smoke Tests', () => {
  beforeAll(async () => {
    console.log(`Running smoke tests against: ${BASE_URL}`);
  });

  describe('Health Checks', () => {
    it('should have a healthy API endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const health = await response.json();
      expect(health.status).toBe('healthy');
      expect(health.environment).toBeDefined();
      expect(health.checks.environment).toBe(true);
      expect(health.checks.api).toBe(true);
    });

    it('should return proper health check structure', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const health = await response.json();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('environment');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('checks');
    });
  });

  describe('Static Assets', () => {
    it('should serve favicon.ico', async () => {
      const response = await fetch(`${BASE_URL}/favicon.ico`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image');
    });

    it('should serve logo.svg', async () => {
      const response = await fetch(`${BASE_URL}/logo.svg`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/svg');
    });

    it('should serve robots.txt', async () => {
      const response = await fetch(`${BASE_URL}/robots.txt`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');
    });

    it('should serve sitemap.xml', async () => {
      const response = await fetch(`${BASE_URL}/sitemap.xml`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('xml');
    });

    it('should serve manifest.json', async () => {
      const response = await fetch(`${BASE_URL}/manifest.json`);
      expect(response.status).toBe(200);
      
      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
    });
  });

  describe('Security Headers', () => {
    it('should have proper security headers', async () => {
      const response = await fetch(`${BASE_URL}/`);
      
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
      expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should not expose sensitive information', async () => {
      const response = await fetch(`${BASE_URL}/`);
      
      expect(response.headers.get('x-powered-by')).toBeNull();
      expect(response.headers.get('server')).not.toContain('Express');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max for first load
    }, 10000);

    it('should have proper caching headers for static assets', async () => {
      const response = await fetch(`${BASE_URL}/logo.svg`);
      const cacheControl = response.headers.get('cache-control');
      
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('max-age');
    });
  });

  describe('API Endpoints', () => {
    it('should handle 404 routes gracefully', async () => {
      const response = await fetch(`${BASE_URL}/nonexistent-route`);
      expect(response.status).toBe(404);
    });

    it('should protect API routes with proper methods', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST'
      });
      expect(response.status).toBe(405); // Method not allowed
    });

    it('should have analytics endpoint available', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test-event',
          data: JSON.stringify({ test: true }),
        }),
      });
      
      expect([200, 400]).toContain(response.status); // 200 if working, 400 if validation fails
    });
  });

  describe('Environment Validation', () => {
    it('should be running in the correct environment', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const health = await response.json();
      
      if (BASE_URL.includes('localhost')) {
        expect(['development', 'test']).toContain(health.environment);
      } else {
        expect(health.environment).toBe('production');
      }
    });
  });
});