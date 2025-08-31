import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Navigation from '@/components/layout/Navigation'

// Mock Next.js navigation
const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname()
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}))

// Mock the icon components
vi.mock('@/components/ui/icons', () => ({
  HomeIcon: () => <div data-testid="home-icon">HomeIcon</div>,
  UserIcon: () => <div data-testid="user-icon">UserIcon</div>,
  SearchIcon: () => <div data-testid="search-icon">SearchIcon</div>,
  TrendingIcon: () => <div data-testid="trending-icon">TrendingIcon</div>
}))

const navigationItems = [
  { href: '/', label: 'Feed', icon: 'home' },
  { href: '/profile', label: 'Profile', icon: 'user' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/hashtag', label: 'Trending', icon: 'trending' }
]

describe('Navigation Component', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/')
  })

  it('renders without crashing', () => {
    render(<Navigation />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders all navigation items with correct labels', () => {
    render(<Navigation />)
    
    navigationItems.forEach(item => {
      // Should render at least one instance of each label (desktop version)
      expect(screen.getByText(item.label)).toBeInTheDocument()
    })
  })

  it('renders correct icons for each navigation item', () => {
    render(<Navigation />)
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.getByTestId('trending-icon')).toBeInTheDocument()
  })

  it('applies active styles to current page link', () => {
    mockPathname.mockReturnValue('/profile')
    render(<Navigation />)
    
    const profileLinks = screen.getAllByText('Profile')
    const desktopProfileLink = profileLinks[0].closest('a')
    
    expect(desktopProfileLink).toHaveClass('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400')
  })

  it('applies hover styles to inactive navigation items', () => {
    mockPathname.mockReturnValue('/profile')
    render(<Navigation />)
    
    const feedLinks = screen.getAllByText('Feed')
    const desktopFeedLink = feedLinks[0].closest('a')
    
    expect(desktopFeedLink).toHaveClass('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-800')
  })

  it('renders both desktop and mobile navigation versions', () => {
    render(<Navigation />)
    
    // Desktop navigation (hidden on mobile)
    const desktopNav = screen.getByRole('navigation')
    expect(desktopNav).toHaveClass('hidden', 'lg:block')
    
    // Mobile navigation (hidden on desktop)  
    const mobileNavContainer = desktopNav.querySelector('.lg\\:hidden')
    expect(mobileNavContainer).toBeInTheDocument()
    expect(mobileNavContainer).toHaveClass('fixed', 'bottom-0')
  })

  it('has correct href attributes for all navigation links', () => {
    render(<Navigation />)
    
    navigationItems.forEach(item => {
      const links = screen.getAllByText(item.label)
      links.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', item.href)
      })
    })
  })

  it('maintains responsive design classes', () => {
    render(<Navigation />)
    
    const nav = screen.getByRole('navigation')
    
    // Desktop classes
    expect(nav).toHaveClass('w-64', 'min-h-screen', 'p-4', 'hidden', 'lg:block')
    expect(nav).toHaveClass('bg-white', 'dark:bg-gray-900')
    expect(nav).toHaveClass('border-r', 'border-gray-200', 'dark:border-gray-800')
  })

  it('highlights correct item based on pathname', () => {
    const testCases = [
      { pathname: '/', expectedActive: 'Feed' },
      { pathname: '/profile', expectedActive: 'Profile' },
      { pathname: '/search', expectedActive: 'Search' },
      { pathname: '/hashtag', expectedActive: 'Trending' }
    ]
    
    testCases.forEach(({ pathname, expectedActive }) => {
      mockPathname.mockReturnValue(pathname)
      const { rerender } = render(<Navigation />)
      
      const activeLinks = screen.getAllByText(expectedActive)
      const desktopActiveLink = activeLinks[0].closest('a')
      
      expect(desktopActiveLink).toHaveClass('bg-blue-100', 'text-blue-600')
      
      rerender(<></>)
    })
  })

  it('has proper semantic structure', () => {
    render(<Navigation />)
    
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('mobile navigation has fixed positioning', () => {
    render(<Navigation />)
    
    const mobileNav = screen.getByRole('navigation').querySelector('.fixed')
    expect(mobileNav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
    expect(mobileNav).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-800')
  })

  it('mobile navigation items have correct styling', () => {
    mockPathname.mockReturnValue('/search')
    render(<Navigation />)
    
    const mobileContainer = screen.getByRole('navigation').querySelector('.lg\\:hidden')
    const mobileSearchLink = mobileContainer?.querySelector('a[href="/search"]')
    
    expect(mobileSearchLink).toHaveClass('text-blue-600', 'dark:text-blue-400')
    expect(mobileSearchLink).toHaveClass('flex', 'flex-col', 'items-center')
  })
})