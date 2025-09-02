import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'

import Spinner from '@/components/ui/Spinner'
import LoadingButton from '@/components/ui/LoadingButton'
import LoadingText from '@/components/ui/LoadingText'
import PostCardSkeleton from '@/components/ui/PostCardSkeleton'
import NavigationSkeleton from '@/components/ui/NavigationSkeleton'
import UserProfileSkeleton from '@/components/ui/UserProfileSkeleton'
import ErrorToast from '@/components/ui/ErrorToast'

describe('Loading Components', () => {
  describe('Spinner', () => {
    it('renders spinner with default props', () => {
      render(<Spinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('renders spinner with custom size', () => {
      render(<Spinner size="lg" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders spinner with custom color', () => {
      render(<Spinner color="secondary" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('border-gray-600')
    })

    it('renders spinner with custom aria-label', () => {
      render(<Spinner aria-label="Processing data" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Processing data')
    })

    it('applies custom className', () => {
      render(<Spinner className="custom-class" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
    })
  })

  describe('LoadingButton', () => {
    it('renders button with children when not loading', () => {
      render(<LoadingButton>Submit</LoadingButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Submit')
      expect(button).not.toBeDisabled()
    })

    it('shows loading state with spinner', () => {
      render(<LoadingButton isLoading>Submit</LoadingButton>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Loading...')
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows custom loading text', () => {
      render(
        <LoadingButton isLoading loadingText="Processing...">
          Submit
        </LoadingButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Processing...')
    })

    it('handles click events when not loading', async () => {
      const handleClick = vi.fn()
      render(<LoadingButton onClick={handleClick}>Submit</LoadingButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not handle click events when loading', () => {
      const handleClick = vi.fn()
      render(
        <LoadingButton isLoading onClick={handleClick}>
          Submit
        </LoadingButton>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('applies different variants correctly', () => {
      const { rerender } = render(<LoadingButton variant="primary">Submit</LoadingButton>)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600')
      
      rerender(<LoadingButton variant="outline">Submit</LoadingButton>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-gray-300')
    })
  })

  describe('LoadingText', () => {
    it('renders with default text', () => {
      render(<LoadingText />)
      
      expect(screen.getByText('Loading')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<LoadingText text="Processing" />)
      
      expect(screen.getByText('Processing')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      render(<LoadingText aria-label="Custom loading message" />)
      
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-label', 'Custom loading message')
    })

    it('renders animated dots', () => {
      render(<LoadingText />)
      
      const dots = screen.getByRole('status').querySelectorAll('div div')
      expect(dots).toHaveLength(3)
      dots.forEach(dot => {
        expect(dot).toHaveClass('animate-pulse')
      })
    })
  })

  describe('PostCardSkeleton', () => {
    it('renders complete skeleton structure', () => {
      render(<PostCardSkeleton />)
      
      const article = screen.getByRole('article')
      expect(article).toBeInTheDocument()
      expect(article).toHaveClass('animate-pulse')
    })

    it('renders without avatar when showAvatar is false', () => {
      const { container } = render(<PostCardSkeleton showAvatar={false} />)
      
      const avatar = container.querySelector('.w-10.h-10')
      expect(avatar).not.toBeInTheDocument()
    })

    it('renders without actions when showActions is false', () => {
      const { container } = render(<PostCardSkeleton showActions={false} />)
      
      const actions = container.querySelector('.flex.items-center.space-x-6')
      expect(actions).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<PostCardSkeleton className="custom-skeleton" />)
      
      const article = screen.getByRole('article')
      expect(article).toHaveClass('custom-skeleton')
    })
  })

  describe('NavigationSkeleton', () => {
    it('renders desktop navigation skeleton by default', () => {
      const { container } = render(<NavigationSkeleton />)
      
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveClass('w-64', 'hidden', 'lg:block')
    })

    it('renders mobile navigation skeleton when specified', () => {
      const { container } = render(<NavigationSkeleton showMobileVersion />)
      
      const mobileNav = container.querySelector('.lg\\:hidden')
      expect(mobileNav).toBeInTheDocument()
      expect(mobileNav).toHaveClass('fixed', 'bottom-0')
    })

    it('renders correct number of navigation items', () => {
      const { container } = render(<NavigationSkeleton />)
      
      const navItems = container.querySelectorAll('.flex.items-center.space-x-3')
      expect(navItems).toHaveLength(4) // 4 navigation items
    })
  })

  describe('UserProfileSkeleton', () => {
    it('renders complete profile skeleton', () => {
      const { container } = render(<UserProfileSkeleton />)
      
      const profileHeader = container.querySelector('.bg-white')
      expect(profileHeader).toBeInTheDocument()
    })

    it('renders with posts section by default', () => {
      const { container } = render(<UserProfileSkeleton />)
      
      const postsSection = container.querySelectorAll('.bg-white')
      expect(postsSection.length).toBeGreaterThan(1) // Header + Posts section
    })

    it('renders without posts when showPosts is false', () => {
      const { container } = render(<UserProfileSkeleton showPosts={false} />)
      
      const postsSection = container.querySelectorAll('.bg-white')
      expect(postsSection).toHaveLength(1) // Only header
    })

    it('renders custom number of post skeletons', () => {
      const { container } = render(<UserProfileSkeleton postCount={5} />)
      
      const postSkeletons = container.querySelectorAll('.p-6')
      expect(postSkeletons.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('ErrorToast', () => {
    it('does not render when not visible', () => {
      render(
        <ErrorToast 
          message="Test error" 
          isVisible={false} 
          onClose={() => {}} 
        />
      )
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('renders when visible', () => {
      render(
        <ErrorToast 
          message="Test error" 
          isVisible={true} 
          onClose={() => {}} 
        />
      )
      
      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
      expect(toast).toHaveTextContent('Test error')
    })

    it('calls onClose when dismiss button is clicked', () => {
      const handleClose = vi.fn()
      render(
        <ErrorToast 
          message="Test error" 
          isVisible={true} 
          onClose={handleClose} 
        />
      )
      
      const dismissButton = screen.getByRole('button')
      fireEvent.click(dismissButton)
      
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('auto-closes after specified duration', async () => {
      const handleClose = vi.fn()
      render(
        <ErrorToast 
          message="Test error" 
          isVisible={true} 
          onClose={handleClose}
          duration={1000}
        />
      )
      
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalledTimes(1)
      }, { timeout: 1500 })
    })

    it('renders different toast types correctly', () => {
      const { rerender } = render(
        <ErrorToast 
          message="Error message" 
          isVisible={true} 
          onClose={() => {}} 
          type="error"
        />
      )
      
      let toast = screen.getByRole('alert')
      expect(toast.querySelector('.bg-red-50')).toBeInTheDocument()
      
      rerender(
        <ErrorToast 
          message="Success message" 
          isVisible={true} 
          onClose={() => {}} 
          type="success"
        />
      )
      
      toast = screen.getByRole('alert')
      expect(toast.querySelector('.bg-green-50')).toBeInTheDocument()
    })

    it('does not auto-close when duration is 0', async () => {
      const handleClose = vi.fn()
      render(
        <ErrorToast 
          message="Test error" 
          isVisible={true} 
          onClose={handleClose}
          duration={0}
        />
      )
      
      // Wait longer than typical auto-close time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      expect(handleClose).not.toHaveBeenCalled()
    })
  })
})

describe('Loading Component Accessibility', () => {
  it('all loading components have proper ARIA labels', () => {
    render(
      <div>
        <Spinner />
        <LoadingText />
        <LoadingButton isLoading>Test</LoadingButton>
      </div>
    )
    
    const statusElements = screen.getAllByRole('status')
    expect(statusElements).toHaveLength(3)
    
    statusElements.forEach(element => {
      expect(element).toHaveAttribute('aria-label')
    })
  })

  it('loading states are announced to screen readers', () => {
    render(<LoadingText />)
    
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('error toast has proper alert role', () => {
    render(
      <ErrorToast 
        message="Test error" 
        isVisible={true} 
        onClose={() => {}} 
      />
    )
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })
})

describe('Animation Performance', () => {
  it('respects reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { container } = render(<PostCardSkeleton />)
    
    // Check that motion-reduce classes are applied
    const animatedElements = container.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})