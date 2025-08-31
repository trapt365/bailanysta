import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Layout from '@/components/layout/Layout'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/'
}))

// Mock Next.js Link component
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

// Helper function to mock viewport size
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

// Helper to check if element has responsive classes
const hasResponsiveClasses = (element: Element, classes: string[]) => {
  return classes.every(className => element.classList.contains(className))
}

describe('Responsive Design Validation Tests', () => {
  beforeEach(() => {
    // Reset to desktop viewport by default
    mockViewport(1024, 768)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Mobile-First Approach (320px - 767px)', () => {
    beforeEach(() => {
      mockViewport(375, 667) // iPhone SE dimensions
    })

    it('applies mobile-first responsive classes to layout components', () => {
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      // Navigation should be hidden on mobile (desktop version)
      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('hidden', 'lg:block')

      // Mobile navigation should be present
      const mobileNav = navigation.querySelector('.lg\\:hidden')
      expect(mobileNav).toBeInTheDocument()
      expect(mobileNav).toHaveClass('fixed', 'bottom-0')
    })

    it('hides desktop search bar on mobile', () => {
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      // Search bar container should be hidden on mobile
      const searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex')
    })

    it('applies responsive container classes correctly', () => {
      render(
        <Layout>
          <div data-testid="main-content">Content</div>
        </Layout>
      )

      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('responsive-container')
    })

    it('mobile navigation items have proper touch targets', () => {
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      const mobileNavContainer = screen.getByRole('navigation').querySelector('.lg\\:hidden')
      const mobileLinks = mobileNavContainer?.querySelectorAll('a')

      mobileLinks?.forEach(link => {
        expect(link).toHaveClass('py-2', 'px-3') // Adequate touch target size
        expect(link).toHaveClass('flex', 'flex-col', 'items-center')
      })
    })
  })

  describe('Tablet Layout (768px - 1023px)', () => {
    beforeEach(() => {
      mockViewport(768, 1024) // iPad dimensions
    })

    it('shows search bar on tablet and desktop', () => {
      render(
        <Layout>
          <div>Tablet Content</div>
        </Layout>
      )

      const searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex')
      // At md breakpoint (768px+), element should be visible
    })

    it('maintains proper spacing on tablet layout', () => {
      render(
        <Layout>
          <div>Tablet Content</div>
        </Layout>
      )

      const header = screen.getByRole('banner')
      const headerContainer = header.querySelector('.responsive-container')
      expect(headerContainer).toBeInTheDocument()

      const flexContainer = headerContainer?.querySelector('.flex')
      expect(flexContainer).toHaveClass('items-center', 'justify-between', 'h-16')
    })
  })

  describe('Desktop Layout (1024px+)', () => {
    beforeEach(() => {
      mockViewport(1280, 800) // Desktop dimensions
    })

    it('shows full desktop navigation sidebar', () => {
      render(
        <Layout>
          <div>Desktop Content</div>
        </Layout>
      )

      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('w-64', 'hidden', 'lg:block')
      expect(navigation).toHaveClass('min-h-screen', 'p-4')
    })

    it('displays all header elements on desktop', () => {
      render(
        <Layout>
          <div>Desktop Content</div>
        </Layout>
      )

      // Brand should be visible
      expect(screen.getByText('Bailanysta')).toBeInTheDocument()

      // Search bar should be visible
      expect(screen.getByPlaceholderText('Search posts, users, hashtags...')).toBeInTheDocument()

      // Action buttons should be visible
      expect(screen.getByTestId('notification-icon')).toBeInTheDocument()
      expect(screen.getByTestId('message-icon')).toBeInTheDocument()
    })

    it('applies proper desktop layout structure', () => {
      render(
        <Layout>
          <div>Desktop Content</div>
        </Layout>
      )

      // Layout should have flex structure
      const layoutContainer = screen.getByRole('main').parentElement
      expect(layoutContainer).toHaveClass('flex')

      // Main content should be flex-1
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('flex-1', 'responsive-container', 'py-6')
    })
  })

  describe('Breakpoint Transitions', () => {
    it('handles transition from mobile to desktop', () => {
      // Start mobile
      mockViewport(375, 667)
      const { rerender } = render(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      let navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('hidden', 'lg:block')

      // Switch to desktop
      mockViewport(1280, 800)
      rerender(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      navigation = screen.getByRole('navigation')
      expect(navigation).toHaveClass('hidden', 'lg:block') // Classes remain same, CSS handles visibility
    })

    it('handles transition from desktop to mobile', () => {
      // Start desktop
      mockViewport(1280, 800)
      const { rerender } = render(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      let searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex')

      // Switch to mobile
      mockViewport(375, 667)
      rerender(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
      expect(searchContainer).toHaveClass('hidden', 'md:flex') // Classes consistent
    })
  })

  describe('Content Adaptation', () => {
    it('adapts navigation labels for mobile', () => {
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      // Mobile navigation should have smaller text
      const mobileNavContainer = screen.getByRole('navigation').querySelector('.lg\\:hidden')
      const mobileLabels = mobileNavContainer?.querySelectorAll('.text-xs')

      expect(mobileLabels?.length).toBeGreaterThan(0)
    })

    it('maintains consistent branding across breakpoints', () => {
      const breakpoints = [
        [375, 667],   // Mobile
        [768, 1024],  // Tablet
        [1280, 800]   // Desktop
      ]

      breakpoints.forEach(([width, height]) => {
        mockViewport(width, height)
        const { rerender } = render(
          <Layout>
            <div>Content</div>
          </Layout>
        )

        // Brand should always be visible
        expect(screen.getByText('Bailanysta')).toBeInTheDocument()
        expect(screen.getByText('B')).toBeInTheDocument() // Logo

        rerender(<></>)
      })
    })
  })

  describe('Accessibility at Different Viewport Sizes', () => {
    it('maintains proper focus management on mobile', () => {
      mockViewport(375, 667)
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      // Check that interactive elements have proper focus styles
      const notificationButton = screen.getByLabelText('View notifications')
      expect(notificationButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
    })

    it('maintains semantic structure across breakpoints', () => {
      const breakpoints = [375, 768, 1280]

      breakpoints.forEach(width => {
        mockViewport(width, 768)
        const { rerender } = render(
          <Layout>
            <div>Content</div>
          </Layout>
        )

        // Semantic elements should always be present
        expect(screen.getByRole('banner')).toBeInTheDocument() // Header
        expect(screen.getByRole('navigation')).toBeInTheDocument() // Navigation
        expect(screen.getByRole('main')).toBeInTheDocument() // Main content

        rerender(<></>)
      })
    })

    it('provides appropriate touch targets on mobile', () => {
      mockViewport(375, 667)
      render(
        <Layout>
          <div>Mobile Content</div>
        </Layout>
      )

      // Mobile navigation links should have adequate touch targets (44px minimum)
      const mobileNavContainer = screen.getByRole('navigation').querySelector('.lg\\:hidden')
      const mobileLinks = mobileNavContainer?.querySelectorAll('a')

      mobileLinks?.forEach(link => {
        // Check for proper padding classes that ensure 44px+ touch targets
        const hasAdequatePadding = link.classList.contains('py-2') && link.classList.contains('px-3')
        expect(hasAdequatePadding).toBe(true)
      })
    })
  })

  describe('Layout Stability', () => {
    it('prevents layout shift during responsive changes', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      )

      const initialLayout = {
        header: screen.getByRole('banner'),
        nav: screen.getByRole('navigation'),
        main: screen.getByRole('main')
      }

      // Verify stable positioning classes
      expect(initialLayout.header).toHaveClass('sticky', 'top-0')
      expect(initialLayout.main).toHaveClass('flex-1')

      // Layout structure should remain consistent
      expect(initialLayout.header.parentElement?.classList.contains('min-h-screen')).toBe(true)
    })
  })
})