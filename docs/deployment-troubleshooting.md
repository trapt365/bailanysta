# Deployment Troubleshooting Guide

## Common Deployment Issues

### Build Failures

#### Issue: "next: command not found"
**Symptoms**: Build fails with `sh: 1: next: not found`
**Cause**: Dependencies not properly installed
**Solutions**:
```bash
# Solution 1: Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Solution 2: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Solution 3: Use CI installation in production
npm ci --legacy-peer-deps
```

#### Issue: Bundle size exceeds 500KB limit
**Symptoms**: Build completes but bundle analyzer shows >500KB
**Cause**: Unoptimized imports or large dependencies
**Solutions**:
```bash
# Analyze bundle composition
npm run analyze

# Check for large dependencies
npx bundle-analyzer .next/static/chunks/*.js

# Optimize imports (use dynamic imports)
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

#### Issue: TypeScript compilation errors
**Symptoms**: `npm run build` fails with TypeScript errors
**Cause**: Type mismatches or missing type definitions
**Solutions**:
```bash
# Check specific TypeScript errors
npm run type-check

# Update TypeScript and type definitions
npm update typescript @types/node @types/react @types/react-dom

# Fix common type issues in next.config.ts
export default nextConfig satisfies NextConfig
```

### Environment Variable Issues

#### Issue: Environment variables not loading
**Symptoms**: Application works locally but fails in production
**Cause**: Environment variables not set in Vercel dashboard
**Solutions**:
```bash
# Verify variables are set in Vercel
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME production

# Check variable format (no quotes in Vercel dashboard)
# Correct: value
# Incorrect: "value"
```

#### Issue: "Environment validation failed"
**Symptoms**: Health check fails with validation errors
**Cause**: Missing or invalid environment variables
**Solutions**:
1. Check required variables in `.env.example`
2. Ensure production secrets are strong (32+ characters)
3. Verify `NEXT_PUBLIC_APP_URL` uses HTTPS in production
4. Check `NODE_ENV` is set to "production"

### Vercel Deployment Issues

#### Issue: Deployment timeout
**Symptoms**: Vercel build times out after 5 minutes
**Cause**: Long build process or dependency installation issues
**Solutions**:
```bash
# Use faster installation command
npm ci --legacy-peer-deps --prefer-offline

# Optimize build in vercel.json
{
  "installCommand": "npm ci --legacy-peer-deps --production=false",
  "buildCommand": "npm run build"
}

# Enable build caching in next.config.ts
experimental: {
  turbo: true
}
```

#### Issue: Static assets not loading
**Symptoms**: 404 errors for favicon, logo, or other static assets
**Cause**: Incorrect public asset paths or missing files
**Solutions**:
```bash
# Verify files exist in public directory
ls -la public/

# Check Next.js static asset configuration
# Assets in public/ are served from /
# Example: public/logo.svg → /logo.svg

# Verify Vercel asset handling
{
  "headers": [
    {
      "source": "/(favicon.ico|logo.svg|robots.txt)",
      "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000"}]
    }
  ]
}
```

### Database and Storage Issues

#### Issue: Data directory not found in production
**Symptoms**: Health check fails with database connectivity error
**Cause**: Data directory not created in serverless environment
**Solutions**:
```bash
# Ensure data directory creation in API route
const fs = await import('fs/promises');
const path = await import('path');
const dataDir = path.join(process.cwd(), 'data');

try {
  await fs.access(dataDir);
} catch {
  await fs.mkdir(dataDir, { recursive: true });
}
```

#### Issue: JSON data corruption
**Symptoms**: Application errors when reading/writing data
**Cause**: Concurrent access or malformed JSON
**Solutions**:
1. Implement file locking for concurrent writes
2. Validate JSON structure before writes
3. Add error recovery for corrupted files
4. Consider migrating to Vercel KV for production

### Performance Issues

#### Issue: Slow page load times
**Symptoms**: Pages take >3 seconds to load
**Cause**: Unoptimized assets or blocking resources
**Solutions**:
```bash
# Enable Next.js performance optimizations
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  experimental: {
    turbo: true
  }
}

# Optimize asset loading
<link rel="preload" href="/critical-font.woff2" as="font" crossOrigin="" />
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
```

#### Issue: High memory usage
**Symptoms**: Serverless function crashes or timeouts
**Cause**: Memory leaks or large data processing
**Solutions**:
```bash
# Configure function memory in vercel.json
{
  "functions": {
    "pages/api/**/*.ts": {
      "memory": 256
    }
  }
}

# Optimize data queries
// Bad: Load all data
const allPosts = await storage.getAllPosts();

// Good: Paginate and limit
const posts = await storage.getPosts({ limit: 20, offset: 0 });
```

### Monitoring and Error Handling

#### Issue: Error monitoring not working
**Symptoms**: No error reports despite application errors
**Cause**: Monitoring service not configured or errors not caught
**Solutions**:
```typescript
// Ensure global error handler is set up
window.addEventListener('error', (event) => {
  monitoring.reportError(new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
  });
});

// Add error boundaries to catch React errors
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### Issue: Health check endpoint failing
**Symptoms**: `/api/health` returns 500 or timeout
**Cause**: Environment validation or database connection issues
**Solutions**:
```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Check specific health check components
{
  "environment": true,  // Environment variables valid
  "database": false,    // <- Check this specifically
  "api": true           // API responding
}

# Debug database health check
console.log('Data directory:', dataDir);
console.log('Data file exists:', await fs.access(dataFile));
```

## Security Issues

### Issue: Security headers not applied
**Symptoms**: Security scan shows missing headers
**Cause**: Headers not configured in Next.js or Vercel
**Solutions**:
```typescript
// In next.config.ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ]
    }
  ]
}

// Or in vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"}
      ]
    }
  ]
}
```

### Issue: Environment secrets exposed
**Symptoms**: Secrets visible in client-side code
**Cause**: Using server secrets with NEXT_PUBLIC_ prefix
**Solutions**:
1. Remove NEXT_PUBLIC_ from server secrets
2. Use server-side only variables for JWT_SECRET, etc.
3. Audit client bundle for exposed secrets
4. Rotate exposed secrets immediately

## CI/CD Pipeline Issues

### Issue: GitHub Actions failing
**Symptoms**: CI pipeline fails on dependency installation
**Cause**: Missing legacy peer deps flag or Node.js version mismatch
**Solutions**:
```yaml
# In .github/workflows/ci.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'

- name: Install dependencies
  run: npm ci --legacy-peer-deps
```

### Issue: Tests failing in CI but passing locally
**Symptoms**: Tests pass locally but fail in GitHub Actions
**Cause**: Environment differences or missing test dependencies
**Solutions**:
```yaml
# Add environment variables to CI
env:
  NEXT_PUBLIC_APP_URL: http://localhost:3000
  NODE_ENV: test

# Install test dependencies
- name: Install Playwright
  run: npx playwright install --with-deps
```

## Recovery Procedures

### Immediate Rollback
```bash
# Using Vercel CLI
vercel rollback <deployment-url>

# Using Vercel Dashboard
# 1. Go to project deployments
# 2. Find last working deployment
# 3. Click "Promote to Production"
```

### Data Recovery
```bash
# If JSON data is corrupted
# 1. Check Vercel function logs for last known good state
# 2. Restore from backup (if available)
# 3. Reinitialize with empty structure:
echo '{"users":{},"posts":{},"comments":{},"reactions":{}}' > data/bailanysta.json
```

### Emergency Contacts
- **Vercel Support**: support@vercel.com
- **GitHub Issues**: Create issue in repository
- **Emergency Rollback**: Use Vercel dashboard for immediate rollback

## Prevention Strategies

### Automated Testing
```bash
# Run full test suite before deployment
npm run type-check
npm run lint
npm test
npm run build

# Use deployment verification script
./scripts/verify-deployment.sh
```

### Monitoring Setup
```bash
# Set up health check monitoring
# Monitor /api/health endpoint every 5 minutes
# Alert on 3 consecutive failures

# Monitor error rates
# Alert on error rate >5% over 10 minutes

# Monitor performance
# Alert on response time >2s average over 5 minutes
```

### Regular Maintenance
```bash
# Weekly dependency updates (patch versions only)
npm update

# Monthly security audit
npm audit --audit-level moderate

# Quarterly dependency major version updates
# Review breaking changes before updating
```