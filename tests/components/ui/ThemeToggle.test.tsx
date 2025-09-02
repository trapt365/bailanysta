import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ThemeToggle from '@/components/ui/ThemeToggle'

// Mock the useTheme hook
const mockToggleTheme = vi.fn()
const mockUseTheme = {
  theme: 'light' as const,
  resolvedTheme: 'light' as const,
  setTheme: vi.fn(),
  toggleTheme: mockToggleTheme,
}

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockUseTheme,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  it('should show sun icon in light theme', () => {
    mockUseTheme.resolvedTheme = 'light'
    
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme')
    expect(button).toHaveAttribute('title', 'Switch to dark theme')
  })

  it('should show moon icon in dark theme', () => {
    mockUseTheme.resolvedTheme = 'dark'
    
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme')
    expect(button).toHaveAttribute('title', 'Switch to light theme')
  })

  it('should call toggleTheme when clicked', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })

  it('should apply custom className when provided', () => {
    render(<ThemeToggle className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should have proper accessibility attributes', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('title')
  })

  it('should have hover and focus styles', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-gray-100', 'dark:hover:bg-gray-800')
  })

  it('should have transition classes for smooth animations', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('transition-all', 'duration-200')
  })
})