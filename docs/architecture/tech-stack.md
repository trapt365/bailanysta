# Technology Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.0+ | Type-safe frontend development | Prevents runtime errors, improves DX, enables shared types |
| Frontend Framework | Next.js | 14.0+ | Full-stack React framework | Combines frontend/backend, optimal Vercel integration, file-based routing |
| UI Component Library | Headless UI + Tailwind | Latest | Accessible component primitives | WAI-ARIA compliant, rapid styling, small bundle size |
| State Management | Zustand | 4.0+ | Lightweight state management | Simple API, TypeScript support, no boilerplate compared to Redux |
| Backend Language | TypeScript | 5.0+ | Unified language stack | Shared types, consistent development experience |
| Backend Framework | Next.js API Routes | 14.0+ | Serverless API endpoints | Zero-config serverless, optimal Vercel deployment |
| API Style | tRPC | 10.0+ | Type-safe API layer | End-to-end type safety, automatic client generation |
| Database | JSON Files → Vercel KV | - | Progressive storage solution | Rapid MVP development, easy migration to Redis |
| Cache | In-Memory → Vercel KV | - | Response caching | Improved performance, reduced API calls |
| File Storage | Local → Vercel Blob | - | Static asset storage | User uploads, profile images in future phases |
| Authentication | Custom JWT | - | Simple token-based auth | No external dependencies for MVP, upgradeable to NextAuth |
| Frontend Testing | Vitest + Testing Library | Latest | Component and integration tests | Fast test runner, React Testing Library for UI |
| Backend Testing | Vitest | Latest | API endpoint testing | Consistent testing stack, TypeScript support |
| E2E Testing | Playwright | Latest | End-to-end user flows | Reliable cross-browser testing, excellent TypeScript support |
| Build Tool | Next.js | 14.0+ | Unified build system | Zero-config, optimized for Vercel deployment |
| Bundler | Turbopack (Next.js) | Latest | Ultra-fast bundling | 10x faster than Webpack, built into Next.js 14 |
| IaC Tool | Vercel CLI | Latest | Deployment configuration | Simple deployment, environment management |
| CI/CD | GitHub Actions | Latest | Automated testing and deployment | Free for public repos, excellent GitHub integration |
| Monitoring | Vercel Analytics | Latest | Performance and error tracking | Built-in analytics, Web Vitals monitoring |
| Logging | Vercel Logs | Latest | Server-side logging | Integrated logging solution |
| CSS Framework | Tailwind CSS | 3.0+ | Utility-first styling | Rapid prototyping, small bundle size, design consistency |