import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
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

// Global test setup
global.beforeEach = beforeEach
global.afterEach = afterEach
global.describe = describe
global.it = it
global.expect = expect
global.vi = vi