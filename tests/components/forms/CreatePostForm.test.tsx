import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreatePostForm from '@/components/forms/CreatePostForm'
import { CreatePostInput } from '@/types/shared'

// Mock handlers
const mockOnSubmit = vi.fn()
const mockOnCancel = vi.fn()

describe('CreatePostForm', () => {
  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isSubmitting: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<CreatePostForm {...defaultProps} />)
    
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish post/i })).toBeInTheDocument()
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument()
  })

  it('displays character counter correctly', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, 'Hello world!')
    
    expect(screen.getByText('268 characters remaining')).toBeInTheDocument()
  })

  it('shows warning when approaching character limit', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const longText = 'a'.repeat(260)
    await user.type(textarea, longText)
    
    expect(screen.getByText('20 characters remaining')).toHaveClass('text-yellow-600')
  })

  it('shows error when exceeding character limit', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const tooLongText = 'a'.repeat(290)
    await user.type(textarea, tooLongText)
    
    expect(screen.getByText('-10 characters remaining')).toHaveClass('text-red-600')
    expect(screen.getByRole('button', { name: /publish post/i })).toBeDisabled()
  })

  it('prevents empty post submission', () => {
    render(<CreatePostForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /publish post/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button with valid content', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const submitButton = screen.getByRole('button', { name: /publish post/i })
    
    await user.type(textarea, 'Valid post content')
    
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit with correct data', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const moodSelect = screen.getByRole('combobox')
    const submitButton = screen.getByRole('button', { name: /publish post/i })
    
    await user.type(textarea, 'Test post content')
    await user.selectOptions(moodSelect, 'Happy')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: 'Test post content',
        mood: 'Happy'
      })
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('shows loading state when submitting', () => {
    render(<CreatePostForm {...defaultProps} isSubmitting={true} />)
    
    expect(screen.getByText(/publishing.../i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeDisabled()
  })

  it('clears form after successful submission', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    const submitButton = screen.getByRole('button', { name: /publish post/i })
    
    await user.type(textarea, 'Test content')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(textarea).toHaveValue('')
      expect(screen.getByText('280 characters remaining')).toBeInTheDocument()
    })
  })

  it('validates content with only whitespace', async () => {
    const user = userEvent.setup()
    render(<CreatePostForm {...defaultProps} />)
    
    const textarea = screen.getByPlaceholderText("What's on your mind?")
    await user.type(textarea, '   \n\t   ')
    
    // Should show validation error
    expect(screen.getByText('Post cannot be empty')).toBeInTheDocument()
  })

  it('displays mood selector with all options', () => {
    render(<CreatePostForm {...defaultProps} />)
    
    const moodSelect = screen.getByRole('combobox')
    expect(moodSelect).toBeInTheDocument()
    
    // Check that mood options are available
    expect(screen.getByText('😊 Happy')).toBeInTheDocument()
    expect(screen.getByText('🤔 Thoughtful')).toBeInTheDocument()
    expect(screen.getByText('🎉 Excited')).toBeInTheDocument()
    expect(screen.getByText('🧘 Contemplative')).toBeInTheDocument()
    expect(screen.getByText('⚡ Energetic')).toBeInTheDocument()
  })
})