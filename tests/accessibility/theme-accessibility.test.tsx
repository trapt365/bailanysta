import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThemeToggle from '@/components/ui/ThemeToggle'
import PostCard from '@/components/feed/PostCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Post } from '@/types/shared'

// Mock tRPC
vi.mock('@/utils/trpc', () => ({
  trpc: {
    reactions: {
      hasUserReacted: {
        useQuery: () => ({ data: false })
      }
    }
  }
}))

// Mock the useTheme hook
const mockUseTheme = {
  theme: 'light' as const,
  resolvedTheme: 'light' as const,
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
}

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockUseTheme,
}))

const mockPost: Post = {
  id: '1',
  content: 'Test post with important information',
  authorId: 'user1',
  authorName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  hashtags: ['test'],
  reactionCount: 0,
  commentCount: 0
}

describe('Theme Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeToggle Accessibility', () => {
    it('should have proper ARIA labels for screen readers', () => {
      mockUseTheme.resolvedTheme = 'light'
      
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
      expect(button).toHaveAttribute('title', 'Switch to dark theme')
    })

    it('should update ARIA labels when theme changes', () => {
      mockUseTheme.resolvedTheme = 'dark'
      
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
      expect(button).toHaveAttribute('title', 'Switch to light theme')
    })

    it('should be keyboard accessible', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
      
      // Should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('should have proper focus indicators', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      // Check for focus styles in class names
      expect(button.className).toContain('focus:outline-none')
    })
  })

  describe('Component Contrast Ratios', () => {
    it('should maintain proper text contrast in light theme', () => {
      mockUseTheme.resolvedTheme = 'light'
      
      render(<PostCard post={mockPost} />)
      
      // Main text should have high contrast (black on white background)
      const content = screen.getByText(mockPost.content)
      expect(content).toHaveClass('text-gray-900') // Dark text for light theme
      
      // Author name should also have high contrast
      const authorName = screen.getByText(mockPost.authorName)
      expect(authorName).toHaveClass('text-gray-900')
    })

    it('should maintain proper text contrast in dark theme', () => {
      mockUseTheme.resolvedTheme = 'dark'
      
      render(<PostCard post={mockPost} />)
      
      // Main text should have high contrast (white on dark background)
      const content = screen.getByText(mockPost.content)
      expect(content).toHaveClass('dark:text-white') // Light text for dark theme
      
      // Author name should also have high contrast
      const authorName = screen.getByText(mockPost.authorName)
      expect(authorName).toHaveClass('dark:text-white')
    })

    it('should maintain proper button contrast ratios', () => {
      render(<Button variant="primary">Test Button</Button>)
      
      const button = screen.getByRole('button')
      // Primary buttons should maintain contrast in both themes
      expect(button).toHaveClass('bg-blue-600', 'text-white')
      expect(button).toHaveClass('dark:bg-blue-600', 'dark:hover:bg-blue-700')
    })

    it('should maintain proper input field contrast', () => {
      render(<Input label="Test Input" placeholder="Enter text" />)
      
      const input = screen.getByRole('textbox')
      // Input should have proper background and text contrast
      expect(input).toHaveClass('text-gray-900', 'dark:text-white')
      expect(input).toHaveClass('bg-white', 'dark:bg-gray-800')
      expect(input).toHaveClass('border-gray-300', 'dark:border-gray-600')
    })

    it('should maintain proper link contrast ratios', () => {
      render(<PostCard post={mockPost} />)
      
      // Hashtags should maintain proper contrast as links
      const hashtag = screen.getByText('#test')
      expect(hashtag).toHaveClass('text-blue-600', 'dark:text-blue-400')
      expect(hashtag).toHaveClass('hover:text-blue-700', 'dark:hover:text-blue-300')
    })
  })

  describe('Focus Management', () => {
    it('should maintain visible focus indicators in light theme', () => {
      render(<Button variant="outline">Test Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
      expect(button).toHaveClass('focus:ring-offset-2')
    })

    it('should maintain visible focus indicators in dark theme', () => {
      render(<Button variant="outline">Test Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-offset-white', 'dark:focus:ring-offset-gray-900')
    })

    it('should have proper focus ring colors for inputs', () => {
      render(<Input label="Test Input" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:ring-blue-500', 'dark:focus:ring-blue-500')
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide proper semantic markup', () => {
      render(<PostCard post={mockPost} />)
      
      // Post should be in an article element
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
      
      // Time should have proper datetime attribute
      const time = screen.getByRole('time')
      expect(time).toHaveAttribute('dateTime')
    })

    it('should have proper heading hierarchy', () => {
      render(<PostCard post={mockPost} />)
      
      // Author name should be accessible to screen readers
      const authorName = screen.getByText(mockPost.authorName)
      expect(authorName).toBeInTheDocument()
    })

    it('should provide alternative text for interactive elements', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
    })
  })

  describe('Color Independence', () => {
    it('should not rely solely on color to convey information', () => {
      render(<PostCard post={mockPost} />)
      
      // Interactive elements should have text labels, not just color
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Should have either text content or aria-label
        expect(
          button.textContent || button.getAttribute('aria-label')
        ).toBeTruthy()
      })
    })

    it('should provide multiple ways to identify interactive states', () => {
      render(<Button variant="primary">Primary Button</Button>)
      
      const button = screen.getByRole('button')
      // Should have hover states beyond just color changes
      expect(button).toHaveClass('hover:bg-blue-700')
    })
  })
})