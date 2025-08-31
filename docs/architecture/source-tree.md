# Project Structure

## Unified Project Structure

```
bailanysta/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yml             # Test and build pipeline
│       └── deploy.yml         # Vercel deployment
├── src/                       # Main application source
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts      # Barrel exports
│   │   ├── forms/            # Form components
│   │   │   ├── CreatePostForm.tsx
│   │   │   ├── EditProfileForm.tsx
│   │   │   └── LoginForm.tsx
│   │   ├── feed/             # Feed components
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostFeed.tsx
│   │   │   ├── ReactionButton.tsx
│   │   │   └── CommentSection.tsx
│   │   ├── user/             # User components
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── UserPostsList.tsx
│   │   └── layout/           # Layout components
│   │       ├── Navigation.tsx
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Layout.tsx
│   ├── pages/                # Next.js pages and API routes
│   │   ├── api/              # API endpoints
│   │   │   ├── trpc/
│   │   │   │   └── [trpc].ts # tRPC handler
│   │   │   ├── auth/
│   │   │   │   ├── login.ts
│   │   │   │   └── register.ts
│   │   │   └── health.ts
│   │   ├── profile/
│   │   │   ├── index.tsx     # Current user profile
│   │   │   └── [userId].tsx  # User profile by ID
│   │   ├── search/
│   │   │   └── index.tsx     # Search results
│   │   ├── hashtag/
│   │   │   └── [tag].tsx     # Hashtag feed
│   │   ├── index.tsx         # Main feed page
│   │   ├── login.tsx         # Login page
│   │   ├── _app.tsx          # App wrapper
│   │   ├── _document.tsx     # HTML document
│   │   └── 404.tsx          # Custom 404
│   ├── server/               # Server-side code
│   │   ├── routers/          # tRPC routers
│   │   │   ├── posts.ts
│   │   │   ├── users.ts
│   │   │   ├── reactions.ts
│   │   │   ├── comments.ts
│   │   │   └── index.ts
│   │   ├── services/         # Business logic
│   │   │   ├── postService.ts
│   │   │   ├── userService.ts
│   │   │   ├── reactionService.ts
│   │   │   └── searchService.ts
│   │   ├── middleware/       # Server middleware
│   │   │   ├── auth.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── validation.ts
│   │   ├── utils/            # Server utilities
│   │   │   ├── storage.ts
│   │   │   ├── jwt.ts
│   │   │   └── errors.ts
│   │   └── trpc.ts          # tRPC setup
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useTheme.ts
│   │   └── useLocalStorage.ts
│   ├── stores/              # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── postsStore.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── shared.ts        # Shared types between client/server
│   │   ├── api.ts           # API-specific types
│   │   └── ui.ts            # UI component types
│   ├── utils/               # Utility functions
│   │   ├── validation.ts    # Zod schemas
│   │   ├── hashtags.ts      # Hashtag extraction
│   │   ├── formatting.ts    # Date/text formatting
│   │   └── constants.ts     # App constants
│   └── styles/              # Styling files
│       ├── globals.css      # Global Tailwind styles
│       └── themes.ts        # Theme configuration
├── public/                  # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
├── data/                    # JSON storage (development)
│   └── bailanysta.json      # Main data file
├── tests/                   # Test files
│   ├── components/          # Component tests
│   ├── pages/              # Page tests
│   ├── server/             # Server tests
│   ├── utils/              # Utility tests
│   ├── setup.ts            # Test setup
│   └── __mocks__/          # Test mocks
├── docs/                   # Documentation
│   ├── prd/                # Sharded PRD files
│   ├── architecture/       # Sharded architecture files
│   └── front-end-spec.md
├── .env.example            # Environment variables template
├── .env.local              # Local environment variables
├── .gitignore              # Git ignore rules
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── tailwind.config.js      # Tailwind configuration
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Required software versions
node -v    # v18.0.0 or higher
npm -v     # v8.0.0 or higher
git --version  # v2.34.0 or higher

# Install Node.js (if not installed)
# Option 1: Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Option 2: Download from nodejs.org
# https://nodejs.org/en/download/
```

#### Initial Setup

```bash
# Clone repository and install dependencies
git clone https://github.com/your-username/bailanysta.git
cd bailanysta
npm install

# Copy environment variables
cp .env.example .env.local

# Generate JWT secret (replace in .env.local)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Initialize data directory
mkdir -p data
echo '{"users":{},"posts":{},"comments":{},"reactions":{}}' > data/bailanysta.json

# Run initial build to verify setup
npm run build
```

#### Development Commands

```bash
# Start development server (frontend + API)
npm run dev

# Start frontend only (for API debugging)
npm run dev:frontend

# Start in different modes
npm run dev:debug        # With debugging enabled
npm run dev:verbose      # With verbose logging

# Database operations (for production)
npm run db:migrate       # Run database migrations
npm run db:seed         # Seed with sample data

# Testing commands
npm run test            # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run end-to-end tests

# Code quality
npm run lint            # Lint code
npm run lint:fix        # Fix linting issues
npm run type-check      # TypeScript type checking

# Build and deployment
npm run build           # Production build
npm run start           # Start production server
npm run analyze         # Bundle analysis
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_APP_NAME="Bailanysta"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_ENVIRONMENT="development"

# Backend (.env.local)
JWT_SECRET="your-super-secret-jwt-key-here"
SESSION_SECRET="your-session-secret-here"
DATABASE_URL="file:./data/bailanysta.json" # For JSON storage
NODE_ENV="development"

# Optional - for future integrations
VERCEL_KV_REST_API_URL=""
VERCEL_KV_REST_API_TOKEN=""
VERCEL_BLOB_READ_WRITE_TOKEN=""

# Development tools
ANALYZE_BUNDLE="false"
DEBUG_MODE="false"
```