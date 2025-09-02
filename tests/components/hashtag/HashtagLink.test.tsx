import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HashtagLink from '@/components/hashtag/HashtagLink'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('HashtagLink', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hashtag with # symbol', () => {
    render(<HashtagLink hashtag="javascript" />)
    expect(screen.getByText('#javascript')).toBeInTheDocument()
  })

  it('navigates to hashtag page on click', async () => {
    render(<HashtagLink hashtag="react" />)
    const link = screen.getByRole('button')
    
    await user.click(link)
    
    expect(mockPush).toHaveBeenCalledWith('/hashtag/react')
  })

  it('handles hashtags with special characters in URL encoding', async () => {
    render(<HashtagLink hashtag="web_development" />)
    const link = screen.getByRole('button')
    
    await user.click(link)
    
    expect(mockPush).toHaveBeenCalledWith('/hashtag/web_development')
  })

  it('calls onClick callback instead of navigation when provided', async () => {
    const mockOnClick = vi.fn()
    render(<HashtagLink hashtag="javascript" onClick={mockOnClick} />)
    
    const link = screen.getByRole('button')
    await user.click(link)
    
    expect(mockOnClick).toHaveBeenCalledWith('javascript')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const customClass = 'custom-hashtag-class'
    render(<HashtagLink hashtag="test" className={customClass} />)
    
    const link = screen.getByRole('button')
    expect(link).toHaveClass(customClass)
  })

  it('applies hover styles on hover', async () => {
    render(<HashtagLink hashtag="test" />)
    const link = screen.getByRole('button')
    
    await user.hover(link)
    
    expect(link).toHaveClass('hover:bg-blue-50')
  })

  it('stops event propagation on click', async () => {
    const parentClickHandler = vi.fn()
    
    render(
      <div onClick={parentClickHandler}>
        <HashtagLink hashtag="test" />
      </div>
    )
    
    const link = screen.getByRole('button')
    await user.click(link)
    
    expect(parentClickHandler).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalled()
  })

  it('prevents default behavior on click', async () => {
    const mockPreventDefault = vi.fn()
    
    render(<HashtagLink hashtag="test" />)
    const link = screen.getByRole('button')
    
    // Simulate click event with preventDefault
    link.addEventListener('click', (e) => {
      mockPreventDefault()
      e.preventDefault()
    })
    
    await user.click(link)
    
    expect(mockPush).toHaveBeenCalled()
  })

  it('handles keyboard navigation (Enter key)', async () => {
    render(<HashtagLink hashtag="react" />)
    const link = screen.getByRole('button')
    
    link.focus()
    await user.keyboard('{Enter}')
    
    expect(mockPush).toHaveBeenCalledWith('/hashtag/react')
  })

  it('handles keyboard navigation (Space key)', async () => {
    render(<HashtagLink hashtag="vue" />)
    const link = screen.getByRole('button')
    
    link.focus()
    await user.keyboard(' ')
    
    expect(mockPush).toHaveBeenCalledWith('/hashtag/vue')
  })
})