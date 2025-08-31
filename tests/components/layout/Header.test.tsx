import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Header from '@/components/layout/Header'

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
  NotificationIcon: () => <div data-testid="notification-icon">NotificationIcon</div>,
  MessageIcon: () => <div data-testid="message-icon">MessageIcon</div>
}))

describe('Header Component', () => {
  it('renders without crashing', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the Bailanysta brand logo and text', () => {
    render(<Header />)
    
    // Check for brand text
    expect(screen.getByText('Bailanysta')).toBeInTheDocument()
    
    // Check for logo "B" in the brand area
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders the search input with correct placeholder', () => {
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  it('renders notification and message icons', () => {
    render(<Header />)
    
    expect(screen.getByTestId('notification-icon')).toBeInTheDocument()
    expect(screen.getByTestId('message-icon')).toBeInTheDocument()
  })

  it('renders user avatar button', () => {
    render(<Header />)
    
    const userAvatar = screen.getByText('U')
    expect(userAvatar).toBeInTheDocument()
    expect(userAvatar.closest('button')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<Header />)
    
    // Check aria-labels for buttons
    expect(screen.getByLabelText('View notifications')).toBeInTheDocument()
    expect(screen.getByLabelText('View messages')).toBeInTheDocument()
    
    // Check semantic header element
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('applies correct CSS classes for responsive design', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('sticky', 'top-0', 'z-50')
    
    // Check search bar is hidden on mobile
    const searchContainer = screen.getByPlaceholderText('Search posts, users, hashtags...').closest('.hidden')
    expect(searchContainer).toHaveClass('hidden', 'md:flex')
  })

  it('brand logo links to home page', () => {
    render(<Header />)
    
    const brandLink = screen.getByText('Bailanysta').closest('a')
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('allows user interaction with search input', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
    await user.type(searchInput, 'test search')
    
    expect(searchInput).toHaveValue('test search')
  })

  it('notification and message buttons are interactive', async () => {
    const user = userEvent.setup()
    render(<Header />)
    
    const notificationButton = screen.getByLabelText('View notifications')
    const messageButton = screen.getByLabelText('View messages')
    
    // Buttons should be focusable and clickable
    expect(notificationButton).toBeEnabled()
    expect(messageButton).toBeEnabled()
    
    await user.click(notificationButton)
    await user.click(messageButton)
    
    // No errors should occur during interaction
  })

  it('has proper dark mode classes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white', 'dark:bg-gray-900')
    expect(header).toHaveClass('border-b', 'border-gray-200', 'dark:border-gray-800')
  })

  it('maintains consistent height and layout structure', () => {
    render(<Header />)
    
    // Check header container structure
    const headerContainer = screen.getByRole('banner').querySelector('.responsive-container')
    expect(headerContainer).toBeInTheDocument()
    
    // Check height class
    const flexContainer = headerContainer?.querySelector('.h-16')
    expect(flexContainer).toBeInTheDocument()
    expect(flexContainer).toHaveClass('flex', 'items-center', 'justify-between')
  })
})