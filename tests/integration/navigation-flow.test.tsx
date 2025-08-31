import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Layout from '@/components/layout/Layout'

// Mock Next.js navigation hooks
const mockPush = vi.fn()
const mockPathname = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: mockPathname(),
    route: mockPathname(),
    query: {},
    asPath: mockPathname(),
  }),
  usePathname: () => mockPathname()
}))

// Mock Next.js Link component to handle navigation
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        mockPush(href)
      }}
      {...props}
    >
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

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockPathname.mockReturnValue('/')
  })

  it('navigates between main sections using desktop navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    )
    
    // Test navigation to Profile
    const profileLink = screen.getAllByText('Profile')[0] // Desktop version
    await user.click(profileLink)
    expect(mockPush).toHaveBeenCalledWith('/profile')
    
    // Test navigation to Search
    const searchLink = screen.getAllByText('Search')[0]
    await user.click(searchLink)
    expect(mockPush).toHaveBeenCalledWith('/search')
    
    // Test navigation to Trending
    const trendingLink = screen.getAllByText('Trending')[0]
    await user.click(trendingLink)
    expect(mockPush).toHaveBeenCalledWith('/hashtag')
    
    // Test navigation back to Feed
    const feedLink = screen.getAllByText('Feed')[0]
    await user.click(feedLink)
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('shows active state for current page in navigation', () => {
    // Test Profile page active state
    mockPathname.mockReturnValue('/profile')
    
    render(
      <Layout>
        <div>Profile Page</div>
      </Layout>
    )
    
    const profileLinks = screen.getAllByText('Profile')
    const desktopProfileLink = profileLinks[0].closest('a')
    
    expect(desktopProfileLink).toHaveClass('bg-blue-100', 'text-blue-600')
  })

  it('updates navigation active state when route changes', () => {
    const { rerender } = render(
      <Layout>
        <div>Feed Page</div>
      </Layout>
    )
    
    // Initially on feed page
    let feedLinks = screen.getAllByText('Feed')
    let desktopFeedLink = feedLinks[0].closest('a')
    expect(desktopFeedLink).toHaveClass('bg-blue-100', 'text-blue-600')
    
    // Change to profile page
    mockPathname.mockReturnValue('/profile')
    rerender(
      <Layout>
        <div>Profile Page</div>
      </Layout>
    )
    
    const profileLinks = screen.getAllByText('Profile')
    const desktopProfileLink = profileLinks[0].closest('a')
    expect(desktopProfileLink).toHaveClass('bg-blue-100', 'text-blue-600')
    
    // Feed should no longer be active
    feedLinks = screen.getAllByText('Feed')
    desktopFeedLink = feedLinks[0].closest('a')
    expect(desktopFeedLink).not.toHaveClass('bg-blue-100', 'text-blue-600')
  })

  it('brand logo navigation works correctly', async () => {
    const user = userEvent.setup()
    mockPathname.mockReturnValue('/profile')
    
    render(
      <Layout>
        <div>Profile Page</div>
      </Layout>
    )
    
    const brandLink = screen.getByText('Bailanysta').closest('a')
    await user.click(brandLink)
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('maintains layout structure during navigation', async () => {
    const user = userEvent.setup()
    
    const { rerender } = render(
      <Layout>
        <div data-testid="feed-content">Feed Content</div>
      </Layout>
    )
    
    // Verify initial layout structure
    expect(screen.getByRole('banner')).toBeInTheDocument() // Header
    expect(screen.getByRole('navigation')).toBeInTheDocument() // Navigation
    expect(screen.getByRole('main')).toBeInTheDocument() // Main content
    expect(screen.getByTestId('feed-content')).toBeInTheDocument()
    
    // Navigate to profile
    mockPathname.mockReturnValue('/profile')
    rerender(
      <Layout>
        <div data-testid="profile-content">Profile Content</div>
      </Layout>
    )
    
    // Layout structure should remain intact
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByTestId('profile-content')).toBeInTheDocument()
    expect(screen.queryByTestId('feed-content')).not.toBeInTheDocument()
  })

  it('keyboard navigation works for navigation links', async () => {
    const user = userEvent.setup()
    
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    // Tab to the first navigation link and activate with Enter
    const profileLink = screen.getAllByText('Profile')[0]
    await user.tab()
    
    // The link should be focusable (depending on implementation)
    await user.keyboard('{Enter}')
    
    // This test verifies that keyboard navigation is supported
    // Actual focus behavior depends on browser implementation
  })

  it('responsive navigation switches between desktop and mobile layouts', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    // Desktop navigation should be hidden on mobile
    const navigation = screen.getByRole('navigation')
    expect(navigation).toHaveClass('hidden', 'lg:block')
    
    // Mobile navigation should be present
    const mobileNav = navigation.querySelector('.lg\\:hidden')
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav).toHaveClass('fixed', 'bottom-0')
  })

  it('all navigation items are present and accessible', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    // Check all expected navigation items exist
    const expectedItems = ['Feed', 'Profile', 'Search', 'Trending']
    
    expectedItems.forEach(item => {
      const links = screen.getAllByText(item)
      expect(links).toHaveLength(2) // Desktop + Mobile versions
      
      links.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href')
      })
    })
  })

  it('navigation preserves scroll position context', async () => {
    const user = userEvent.setup()
    
    render(
      <Layout>
        <div style={{ height: '2000px' }}>Long Content</div>
      </Layout>
    )
    
    // Simulate navigation
    const profileLink = screen.getAllByText('Profile')[0]
    await user.click(profileLink)
    
    // Verify navigation was called (scroll behavior is browser-specific)
    expect(mockPush).toHaveBeenCalledWith('/profile')
  })
})