import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental Turbopack features
  experimental: {
    turbo: {
      // Enable Turbopack optimizations
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
  },

  // Production optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  generateEtags: true, // Enable ETags for caching
  
  // Image optimization configuration
  images: {
    formats: ['image/webp', 'image/avif'], // Modern image formats
    domains: [], // Add domains as needed for external images
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.vercel.com;",
          },
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/(_next/static|favicon.ico|logo.svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimizations for bundle size
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Tree shaking optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
      
      // Bundle size optimizations
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },

  // Output configuration
  output: 'standalone',
  
  // Environment configuration
  env: {
    NEXT_RUNTIME: 'nodejs',
  },
};

export default nextConfig;
