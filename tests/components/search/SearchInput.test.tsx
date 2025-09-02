import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchInput from '@/components/search/SearchInput'

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams('q=test+query'),
  usePathname: () => '/search'
}))

describe('SearchInput', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    render(<SearchInput />)
    expect(screen.getByPlaceholderText('Search posts, users, hashtags...')).toBeInTheDocument()
  })

  it('displays initial value from URL params', () => {
    render(<SearchInput />)
    const input = screen.getByDisplayValue('test query')
    expect(input).toBeInTheDocument()
  })

  it('handles input changes and updates URL on enter', async () => {
    render(<SearchInput />)
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'new search query')
    
    expect(input).toHaveValue('new search query')
    
    await user.type(input, '{enter}')
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/search?q=new+search+query')
    })
  })

  it('clears search when clear button is clicked', async () => {
    render(<SearchInput />)
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'search term')
    expect(input).toHaveValue('search term')
    
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)
    
    expect(input).toHaveValue('')
  })

  it('shows search icon by default', () => {
    render(<SearchInput />)
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows clear button when input has value', async () => {
    render(<SearchInput />)
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'search')
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
    })
  })

  it('calls onSearch callback when provided', async () => {
    const mockOnSearch = vi.fn()
    render(<SearchInput onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'test query{enter}')
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query')
    })
  })

  it('handles keyboard shortcuts', async () => {
    render(<SearchInput />)
    const input = screen.getByRole('textbox')
    
    // Simulate Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    fireEvent.keyDown(input, { key: 'k', metaKey: true })
    
    expect(input).toHaveFocus()
  })

  it('respects autoFocus prop', () => {
    render(<SearchInput autoFocus />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()
  })

  it('applies custom className', () => {
    const customClass = 'custom-search-class'
    render(<SearchInput className={customClass} />)
    
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass(customClass)
  })

  it('shows loading state when isLoading prop is true', () => {
    render(<SearchInput isLoading />)
    expect(screen.getByText(/searching/i)).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(<SearchInput disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})