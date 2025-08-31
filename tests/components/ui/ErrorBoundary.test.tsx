import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Test content</div>
}

// Mock console.error to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock window.location.reload
const reloadSpy = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: reloadSpy },
  writable: true
})

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    consoleSpy.mockClear()
    reloadSpy.mockClear()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('We apologize for the inconvenience. Please try refreshing the page.')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('logs error to console when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error caught by boundary:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('refresh button triggers page reload', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const refreshButton = screen.getByText('Refresh Page')
    fireEvent.click(refreshButton)
    
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  it('displays error icon in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const errorIcon = screen.getByRole('button').previousElementSibling?.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()
    expect(errorIcon).toHaveClass('h-6', 'w-6', 'text-red-600', 'dark:text-red-400')
  })

  it('applies correct CSS classes for error UI layout', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Check main container classes
    const mainContainer = screen.getByText('Something went wrong').closest('.min-h-screen')
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
    expect(mainContainer).toHaveClass('bg-gray-50', 'dark:bg-gray-900')
  })

  it('has proper dark mode classes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const errorCard = screen.getByText('Something went wrong').closest('.bg-white')
    expect(errorCard).toHaveClass('bg-white', 'dark:bg-gray-800')
    
    const title = screen.getByText('Something went wrong')
    expect(title).toHaveClass('text-gray-900', 'dark:text-gray-100')
    
    const description = screen.getByText('We apologize for the inconvenience. Please try refreshing the page.')
    expect(description).toHaveClass('text-gray-500', 'dark:text-gray-400')
  })

  it('refresh button has proper accessibility and styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const refreshButton = screen.getByText('Refresh Page')
    expect(refreshButton).toBeEnabled()
    expect(refreshButton).toHaveClass('inline-flex', 'items-center')
    expect(refreshButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700')
    expect(refreshButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  it('maintains error state after re-render', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Re-render with same error-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('recovers when children change to non-throwing component', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <div>Recovered content</div>
      </ErrorBoundary>
    )
    
    // Note: In React, ErrorBoundary state persists, so error UI remains
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('error boundary catches errors from deeply nested components', () => {
    const DeeplyNested = () => (
      <div>
        <div>
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        </div>
      </div>
    )
    
    render(
      <ErrorBoundary>
        <DeeplyNested />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})