import '@testing-library/jest-dom'
import { expect, afterEach, beforeEach, describe, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables for testing
process.env.NEXT_PUBLIC_APP_NAME = 'Bailanysta'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
process.env.NEXT_PUBLIC_ENVIRONMENT = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long-for-testing'
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long-for-testing'
process.env.DATABASE_URL = 'file:./data/test-bailanysta.json'
process.env.NODE_ENV = 'test'

// Mock fetch for deployment tests
global.fetch = vi.fn()

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock performance API for performance tests
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
})

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Global test setup
global.beforeEach = beforeEach
global.afterEach = afterEach
global.describe = describe
global.it = it
global.expect = expect
global.vi = vi

// Clean up environment after each test
afterEach(() => {
  vi.clearAllMocks()
  if (global.fetch) {
    vi.mocked(global.fetch).mockClear()
  }
})