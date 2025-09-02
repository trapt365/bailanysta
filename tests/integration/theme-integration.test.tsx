import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Navigation from '@/components/layout/Navigation'
import PostCard from '@/components/feed/PostCard'
import { Post } from '@/types/shared'

// Mock tRPC
vi.mock('@/utils/trpc', () => ({
  trpc: {
    posts: {
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        })
      }
    },
    reactions: {
      hasUserReacted: {
        useQuery: () => ({ data: false })
      }
    }
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  }
}

// Mock window.matchMedia
const matchMediaMock = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(global, 'document', {
  value: {
    documentElement: documentElementMock
  }
})

Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn(() => matchMediaMock)
  }
})

const mockPost: Post = {
  id: '1',
  content: 'Test post content with #hashtag',
  authorId: 'user1',
  authorName: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  hashtags: ['hashtag'],
  reactionCount: 5,
  commentCount: 2,
  mood: 'Happy'
}

describe('Theme Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.matches = false
  })

  it('should apply theme across all components consistently', async () => {
    const { container } = render(
      <div>
        <Navigation />
        <PostCard post={mockPost} />
      </div>
    )

    // Find theme toggle button
    const themeToggle = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(themeToggle).toBeInTheDocument()

    // Click theme toggle
    fireEvent.click(themeToggle)

    // Verify dark theme was applied to document
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preference', 'dark')
  })

  it('should persist theme preference across browser sessions', () => {
    // Simulate stored dark theme preference
    localStorageMock.getItem.mockReturnValue('dark')

    render(<Navigation />)

    // Should initialize with stored preference
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme-preference')
  })

  it('should respect system theme preference on first visit', () => {
    // Simulate dark system preference
    matchMediaMock.matches = true
    localStorageMock.getItem.mockReturnValue(null)

    render(<Navigation />)

    const themeToggle = screen.getByRole('button', { name: /switch to light theme/i })
    expect(themeToggle).toBeInTheDocument()
  })

  it('should update theme toggle label when theme changes', async () => {
    render(<Navigation />)

    // Initial state - light theme
    let themeToggle = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(themeToggle).toBeInTheDocument()

    // Click to switch to dark theme
    fireEvent.click(themeToggle)

    // Should update to show switch to light option
    await waitFor(() => {
      const updatedToggle = screen.getByRole('button', { name: /switch to light theme/i })
      expect(updatedToggle).toBeInTheDocument()
    })
  })

  it('should apply dark theme classes to PostCard component', () => {
    render(<PostCard post={mockPost} />)

    // Check for dark theme classes in PostCard
    const article = screen.getByRole('article')
    expect(article).toHaveClass('bg-white', 'dark:bg-gray-800')
    expect(article).toHaveClass('border-gray-200', 'dark:border-gray-700')

    // Check author name has dark theme text color
    const authorName = screen.getByText('Test User')
    expect(authorName).toHaveClass('text-gray-900', 'dark:text-white')
  })

  it('should maintain proper contrast ratios in both themes', () => {
    render(<PostCard post={mockPost} />)

    // Verify light theme contrast
    const content = screen.getByText(/Test post content/)
    expect(content).toHaveClass('text-gray-900', 'dark:text-white')

    // Verify hashtag contrast
    const hashtag = screen.getByText('#hashtag')
    expect(hashtag).toHaveClass('text-blue-600', 'dark:text-blue-400')
  })

  it('should handle theme transitions smoothly', () => {
    render(<Navigation />)

    const themeToggle = screen.getByRole('button')
    
    // Verify transition classes are applied
    expect(themeToggle).toHaveClass('transition-all', 'duration-200')
  })

  it('should support keyboard navigation for theme toggle', () => {
    render(<Navigation />)

    const themeToggle = screen.getByRole('button', { name: /switch to dark theme/i })
    
    // Should be focusable
    themeToggle.focus()
    expect(themeToggle).toHaveFocus()
    
    // Should respond to Enter key
    fireEvent.keyDown(themeToggle, { key: 'Enter' })
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should work correctly on mobile navigation', () => {
    render(<Navigation />)

    // Find mobile theme toggle (should be present in mobile nav)
    const mobileThemeToggles = screen.getAllByRole('button', { name: /switch to/i })
    expect(mobileThemeToggles.length).toBeGreaterThan(1) // Desktop + mobile
    
    // Click mobile theme toggle
    fireEvent.click(mobileThemeToggles[1])
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
  })
})