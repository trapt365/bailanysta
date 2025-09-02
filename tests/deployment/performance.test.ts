import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PerformanceMetrics {
  responseTime: number;
  ttfb: number; // Time to First Byte
  contentLength: number;
}

describe('Performance Tests', () => {
  beforeAll(() => {
    console.log(`Running performance tests against: ${BASE_URL}`);
  });

  async function measurePerformance(url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const response = await fetch(url);
    const ttfb = Date.now() - startTime;
    
    const content = await response.text();
    const responseTime = Date.now() - startTime;
    
    return {
      responseTime,
      ttfb,
      contentLength: content.length,
    };
  }

  describe('Page Load Performance', () => {
    it('should load the homepage within performance budgets', async () => {
      const metrics = await measurePerformance(BASE_URL);
      
      console.log('Homepage metrics:', metrics);
      
      // Performance targets
      expect(metrics.responseTime).toBeLessThan(3000); // 3 seconds total
      expect(metrics.ttfb).toBeLessThan(800); // 800ms TTFB
    }, 10000);

    it('should load API endpoints quickly', async () => {
      const metrics = await measurePerformance(`${BASE_URL}/api/health`);
      
      console.log('Health API metrics:', metrics);
      
      // API should be much faster
      expect(metrics.responseTime).toBeLessThan(1000); // 1 second
      expect(metrics.ttfb).toBeLessThan(500); // 500ms TTFB
    }, 5000);
  });

  describe('Resource Loading', () => {
    it('should load static assets efficiently', async () => {
      const assets = [
        '/favicon.ico',
        '/logo.svg',
        '/manifest.json',
      ];

      for (const asset of assets) {
        const metrics = await measurePerformance(`${BASE_URL}${asset}`);
        console.log(`Asset ${asset} metrics:`, metrics);
        
        // Static assets should load very quickly
        expect(metrics.responseTime).toBeLessThan(1000);
        expect(metrics.ttfb).toBeLessThan(300);
      }
    }, 10000);

    it('should have appropriate content sizes', async () => {
      const homepageMetrics = await measurePerformance(BASE_URL);
      
      // Homepage should not be too large
      expect(homepageMetrics.contentLength).toBeLessThan(1024 * 1024); // 1MB
      console.log(`Homepage size: ${(homepageMetrics.contentLength / 1024).toFixed(2)}KB`);
    });
  });

  describe('Caching Performance', () => {
    it('should return cached responses quickly on second request', async () => {
      // First request
      const firstRequest = await measurePerformance(`${BASE_URL}/logo.svg`);
      
      // Second request (should be faster due to caching)
      const secondRequest = await measurePerformance(`${BASE_URL}/logo.svg`);
      
      console.log('First request TTFB:', firstRequest.ttfb);
      console.log('Second request TTFB:', secondRequest.ttfb);
      
      // Second request should be faster (allow some variance for network conditions)
      expect(secondRequest.ttfb).toBeLessThanOrEqual(firstRequest.ttfb + 100);
    }, 10000);

    it('should have proper cache headers for performance', async () => {
      const response = await fetch(`${BASE_URL}/logo.svg`);
      const cacheControl = response.headers.get('cache-control');
      
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('max-age');
      
      // Should cache for a reasonable time
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1]);
        expect(maxAge).toBeGreaterThan(3600); // At least 1 hour
      }
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() => 
        measurePerformance(`${BASE_URL}/api/health`)
      );
      
      const results = await Promise.all(requests);
      
      // All requests should complete successfully
      expect(results).toHaveLength(concurrentRequests);
      
      // Average response time should still be reasonable
      const averageResponseTime = results.reduce((sum, result) => 
        sum + result.responseTime, 0) / results.length;
      
      console.log(`Average response time under load: ${averageResponseTime}ms`);
      expect(averageResponseTime).toBeLessThan(2000); // 2 seconds average
      
    }, 15000);
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks in repeated requests', async () => {
      const iterations = 10;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const metrics = await measurePerformance(`${BASE_URL}/api/health`);
        results.push(metrics.responseTime);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Response times should remain consistent (not increasing significantly)
      const firstHalf = results.slice(0, 5);
      const secondHalf = results.slice(5);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      console.log(`First half average: ${firstAvg}ms, Second half average: ${secondAvg}ms`);
      
      // Second half should not be significantly slower (allow 50% increase max)
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);
      
    }, 20000);
  });

  describe('Error Response Performance', () => {
    it('should handle 404 errors quickly', async () => {
      const metrics = await measurePerformance(`${BASE_URL}/nonexistent-page`);
      
      console.log('404 response metrics:', metrics);
      
      // Error responses should still be fast
      expect(metrics.responseTime).toBeLessThan(2000);
      expect(metrics.ttfb).toBeLessThan(1000);
    });

    it('should handle API errors efficiently', async () => {
      const metrics = await measurePerformance(`${BASE_URL}/api/nonexistent`);
      
      console.log('API error metrics:', metrics);
      
      // API errors should be even faster
      expect(metrics.responseTime).toBeLessThan(1000);
      expect(metrics.ttfb).toBeLessThan(500);
    });
  });
});