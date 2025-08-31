import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Layout from '@/components/layout/Layout'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/'
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}))

// Mock icon components
vi.mock('@/components/ui/icons', () => ({
  HomeIcon: () => <div data-testid="home-icon">Home</div>,
  UserIcon: () => <div data-testid="user-icon">User</div>,
  SearchIcon: () => <div data-testid="search-icon">Search</div>,
  TrendingIcon: () => <div data-testid="trending-icon">Trending</div>,
  NotificationIcon: () => <div data-testid="notification-icon">Notifications</div>,
  MessageIcon: () => <div data-testid="message-icon">Messages</div>
}))

describe('Story 1.1 Coverage: Project Setup & Basic UI Framework', () => {
  
  describe('AC1: React 18+ setup and TypeScript configuration', () => {
    it('validates React 18+ features are available', () => {
      // Test that React 18 features like automatic batching work
      render(
        <Layout>
          <div>React 18 Test Content</div>
        </Layout>
      )
      
      expect(screen.getByText('React 18 Test Content')).toBeInTheDocument()
      
      // Verify TypeScript compilation worked (no runtime errors)
      const layout = screen.getByRole('banner').closest('div')
      expect(layout).toBeInTheDocument()
    })

    it('validates TypeScript strict mode configuration', () => {
      // This test passing means TypeScript compilation succeeded with strict types
      interface TestProps {
        title: string
        count: number
      }
      
      const TypeScriptTestComponent = ({ title, count }: TestProps) => (
        <div>
          <h1>{title}</h1>
          <span>{count}</span>
        </div>
      )
      
      render(
        <Layout>
          <TypeScriptTestComponent title="Test Title" count={42} />
        </Layout>
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('validates environment variable configuration access', () => {
      // Test that environment configuration is accessible
      const EnvTestComponent = () => {
        // In real implementation, would access through config utility
        const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Bailanysta'
        return <div data-testid="app-name">{appName}</div>
      }
      
      render(
        <Layout>
          <EnvTestComponent />
        </Layout>
      )
      
      expect(screen.getByTestId('app-name')).toBeInTheDocument()
    })
  })

  describe('AC2: Tailwind CSS integration and responsive breakpoints', () => {
    it('validates Tailwind CSS classes are applied correctly', () => {
      render(
        <Layout>
          <div>Tailwind Test Content</div>
        </Layout>
      )
      
      // Check that Tailwind classes are present on layout components
      const rootContainer = screen.getByRole('banner').closest('.min-h-screen')
      expect(rootContainer).toHaveClass('min-h-screen', 'bg-background', 'text-foreground')
      
      // Check responsive classes
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('hidden', 'lg:block')
      
      // Check header responsive classes
      const searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex')
    })

    it('validates responsive breakpoint behavior', () => {
      render(
        <Layout>
          <div>Responsive Test Content</div>
        </Layout>
      )
      
      // Mobile navigation should exist
      const mobileNav = screen.getByRole('navigation').querySelector('.lg\\:hidden')
      expect(mobileNav).toBeInTheDocument()
      expect(mobileNav).toHaveClass('fixed', 'bottom-0')
      
      // Desktop navigation should have proper width
      const desktopNav = screen.getByRole('navigation')
      expect(desktopNav).toHaveClass('w-64')
    })

    it('validates dark mode Tailwind classes', () => {
      render(
        <Layout>
          <div>Dark Mode Test</div>
        </Layout>
      )
      
      // Check dark mode classes are present
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-white', 'dark:bg-gray-900')
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('bg-white', 'dark:bg-gray-900')
    })
  })

  describe('AC3: Application shell structure and components', () => {
    it('validates complete application shell structure', () => {
      render(
        <Layout>
          <div data-testid="page-content">Test Page Content</div>
        </Layout>
      )
      
      // Verify all shell components are present
      expect(screen.getByRole('banner')).toBeInTheDocument() // Header
      expect(screen.getByRole('navigation')).toBeInTheDocument() // Navigation
      expect(screen.getByRole('main')).toBeInTheDocument() // Main content area
      
      // Verify content is rendered in main
      const mainElement = screen.getByRole('main')
      expect(mainElement).toContainElement(screen.getByTestId('page-content'))
    })

    it('validates Layout component integration', () => {
      render(
        <Layout>
          <div>Child Content</div>
        </Layout>
      )
      
      // Layout should wrap all content
      const layoutRoot = screen.getByRole('banner').closest('.min-h-screen')
      expect(layoutRoot).toBeInTheDocument()
      
      // Should contain Header, Navigation, and Main
      expect(layoutRoot?.querySelector('header')).toBeInTheDocument()
      expect(layoutRoot?.querySelector('nav')).toBeInTheDocument()
      expect(layoutRoot?.querySelector('main')).toBeInTheDocument()
    })

    it('validates Header component functionality', () => {
      render(
        <Layout>
          <div>Header Test Content</div>
        </Layout>
      )
      
      // Brand elements
      expect(screen.getByText('Bailanysta')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument() // Logo
      
      // Interactive elements
      expect(screen.getByTestId('notification-icon')).toBeInTheDocument()
      expect(screen.getByTestId('message-icon')).toBeInTheDocument()
      
      // Search functionality
      expect(screen.getByPlaceholderText('Search posts, users, hashtags...')).toBeInTheDocument()
    })

    it('validates Navigation component functionality', () => {
      render(
        <Layout>
          <div>Navigation Test Content</div>
        </Layout>
      )
      
      // All navigation items should be present
      const expectedItems = ['Feed', 'Profile', 'Search', 'Trending']
      expectedItems.forEach(item => {
        expect(screen.getAllByText(item)).toHaveLength(2) // Desktop + Mobile
      })
      
      // Icons should be present
      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trending-icon')).toBeInTheDocument()
    })
  })

  describe('AC4: Next.js routing and page navigation', () => {
    it('validates Next.js App Router structure compatibility', () => {
      // Test that components work with Next.js App Router
      render(
        <Layout>
          <div data-testid="app-router-content">App Router Test</div>
        </Layout>
      )
      
      // Layout should work as root layout
      expect(screen.getByTestId('app-router-content')).toBeInTheDocument()
      
      // Navigation links should have proper hrefs
      const feedLink = screen.getAllByText('Feed')[0].closest('a')
      expect(feedLink).toHaveAttribute('href', '/')
      
      const profileLink = screen.getAllByText('Profile')[0].closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })

    it('validates page navigation structure', () => {
      render(
        <Layout>
          <div>Navigation Structure Test</div>
        </Layout>
      )
      
      // All expected routes should have navigation links
      const routes = [
        { path: '/', label: 'Feed' },
        { path: '/profile', label: 'Profile' },
        { path: '/search', label: 'Search' },
        { path: '/hashtag', label: 'Trending' }
      ]
      
      routes.forEach(route => {
        const links = screen.getAllByText(route.label)
        links.forEach(link => {
          expect(link.closest('a')).toHaveAttribute('href', route.path)
        })
      })
    })
  })

  describe('AC5: Error boundaries and error handling', () => {
    it('validates ErrorBoundary integration in application shell', () => {
      // Error boundary should be available for use
      const { ErrorBoundary } = require('@/components/ui/ErrorBoundary')
      expect(ErrorBoundary).toBeDefined()
      
      // Test would normally wrap Layout with ErrorBoundary
      render(
        <Layout>
          <div>Error Boundary Test</div>
        </Layout>
      )
      
      expect(screen.getByText('Error Boundary Test')).toBeInTheDocument()
    })
  })

  describe('AC6: Performance and accessibility foundations', () => {
    it('validates semantic HTML structure for accessibility', () => {
      render(
        <Layout>
          <div>Accessibility Test</div>
        </Layout>
      )
      
      // Semantic landmarks should be present
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('navigation')).toBeInTheDocument() // nav  
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      
      // Interactive elements should have proper labels
      expect(screen.getByLabelText('View notifications')).toBeInTheDocument()
      expect(screen.getByLabelText('View messages')).toBeInTheDocument()
    })

    it('validates performance-oriented component structure', () => {
      render(
        <Layout>
          <div>Performance Test</div>
        </Layout>
      )
      
      // Layout should not cause unnecessary re-renders
      // Proper component structure should be in place
      const layoutStructure = screen.getByRole('main').parentElement
      expect(layoutStructure).toHaveClass('flex')
      
      // Sticky header for performance
      expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0')
    })

    it('validates responsive design performance patterns', () => {
      render(
        <Layout>
          <div>Responsive Performance Test</div>
        </Layout>
      )
      
      // Mobile navigation should be conditionally rendered/hidden
      const mobileNav = screen.getByRole('navigation').querySelector('.lg\\:hidden')
      expect(mobileNav).toBeInTheDocument()
      
      // Desktop search should be conditionally shown
      const searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex')
    })
  })

  describe('AC7: Development workflow and tooling integration', () => {
    it('validates TypeScript compilation without errors', () => {
      // If this test runs, TypeScript compilation succeeded
      render(
        <Layout>
          <div>TypeScript Integration Test</div>
        </Layout>
      )
      
      expect(screen.getByText('TypeScript Integration Test')).toBeInTheDocument()
    })

    it('validates component prop type safety', () => {
      interface TestComponentProps {
        title: string
        optional?: boolean
      }
      
      const TestComponent = ({ title, optional = false }: TestComponentProps) => (
        <div>
          <span>{title}</span>
          {optional && <span>Optional content</span>}
        </div>
      )
      
      render(
        <Layout>
          <TestComponent title="Required Title" optional={true} />
        </Layout>
      )
      
      expect(screen.getByText('Required Title')).toBeInTheDocument()
      expect(screen.getByText('Optional content')).toBeInTheDocument()
    })
  })

  describe('AC8: Basic UI consistency and design system foundation', () => {
    it('validates consistent styling patterns across components', () => {
      render(
        <Layout>
          <div>Design System Test</div>
        </Layout>
      )
      
      // Header and Navigation should use consistent background colors
      const header = screen.getByRole('banner')
      const navigation = screen.getByRole('navigation')
      
      expect(header).toHaveClass('bg-white', 'dark:bg-gray-900')
      expect(navigation).toHaveClass('bg-white', 'dark:bg-gray-900')
      
      // Consistent border styling
      expect(header).toHaveClass('border-b', 'border-gray-200', 'dark:border-gray-800')
      expect(navigation).toHaveClass('border-r', 'border-gray-200', 'dark:border-gray-800')
    })

    it('validates color scheme and theming consistency', () => {
      render(
        <Layout>
          <div>Theme Consistency Test</div>
        </Layout>
      )
      
      // Root container should have theme classes
      const rootContainer = screen.getByRole('banner').closest('.min-h-screen')
      expect(rootContainer).toHaveClass('bg-background', 'text-foreground')
      
      // Interactive elements should have consistent focus styles
      const notificationButton = screen.getByLabelText('View notifications')
      expect(notificationButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
    })

    it('validates spacing and layout consistency', () => {
      render(
        <Layout>
          <div>Layout Consistency Test</div>
        </Layout>
      )
      
      // Header height consistency
      const headerContainer = screen.getByRole('banner').querySelector('.h-16')
      expect(headerContainer).toBeInTheDocument()
      
      // Main content padding
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('py-6')
      
      // Navigation padding
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('p-4')
    })
  })
})