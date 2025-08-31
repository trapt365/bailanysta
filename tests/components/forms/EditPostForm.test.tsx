import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EditPostForm from '@/components/forms/EditPostForm'
import { Post } from '@/types/shared'

// Mock the UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, loading, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      data-testid={props.type === 'submit' ? 'save-button' : 'cancel-button'}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Textarea: ({ value, onChange, error, disabled, ...props }: any) => (
    <div>
      <textarea 
        value={value}
        onChange={onChange}
        disabled={disabled}
        data-testid="content-textarea"
        {...props}
      />
      {error && <span data-testid="content-error">{error}</span>}
    </div>
  )
}))

const mockPost: Post = {
  id: 'test-post-id',
  content: 'Original post content',
  authorId: 'user-1',
  authorName: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  mood: 'Happy',
  hashtags: ['test'],
  reactionCount: 0,
  commentCount: 0
}

describe('EditPostForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with post data pre-filled', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByDisplayValue('Original post content')
    const moodSelect = screen.getByDisplayValue('Happy')
    
    expect(textarea).toBeInTheDocument()
    expect(moodSelect).toBeInTheDocument()
  })

  it('shows character counter with remaining characters', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    // Original content is 21 characters
    expect(screen.getByText('259 characters remaining')).toBeInTheDocument()
  })

  it('shows last updated timestamp', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
  })

  it('calls onSave with updated data when form is submitted', async () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByTestId('content-textarea')
    const saveButton = screen.getByTestId('save-button')

    // Update content
    fireEvent.change(textarea, { target: { value: 'Updated post content' } })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: 'test-post-id',
        content: 'Updated post content',
        mood: 'Happy'
      })
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('disables form when loading', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    )

    const textarea = screen.getByTestId('content-textarea')
    const saveButton = screen.getByTestId('save-button')
    const moodSelect = screen.getByRole('combobox')

    expect(textarea).toBeDisabled()
    expect(saveButton).toBeDisabled()
    expect(moodSelect).toBeDisabled()
    expect(saveButton).toHaveTextContent('Saving...')
  })

  it('shows validation error for empty content', async () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByTestId('content-textarea')
    const saveButton = screen.getByTestId('save-button')

    // Clear content
    fireEvent.change(textarea, { target: { value: '' } })
    
    // Save button should be disabled for empty content
    expect(saveButton).toBeDisabled()
  })

  it('shows validation error when content exceeds 280 characters', async () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByTestId('content-textarea')
    const saveButton = screen.getByTestId('save-button')

    // Set content over 280 characters
    const longContent = 'a'.repeat(281)
    fireEvent.change(textarea, { target: { value: longContent } })

    // Should show red character count
    await waitFor(() => {
      expect(screen.getByText('-1 characters remaining')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
    })
  })

  it('updates character count as user types', async () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByTestId('content-textarea')

    fireEvent.change(textarea, { target: { value: 'Short' } })

    await waitFor(() => {
      expect(screen.getByText('275 characters remaining')).toBeInTheDocument()
    })
  })

  it('disables save button when no changes are made', () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const saveButton = screen.getByTestId('save-button')
    
    // Should be disabled initially since no changes made
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when content is changed', async () => {
    render(
      <EditPostForm 
        post={mockPost}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const textarea = screen.getByTestId('content-textarea')
    const saveButton = screen.getByTestId('save-button')

    fireEvent.change(textarea, { target: { value: 'Changed content' } })

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('preserves mood selection when editing', () => {
    const postWithoutMood = { ...mockPost, mood: undefined }
    
    render(
      <EditPostForm 
        post={postWithoutMood}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const moodSelect = screen.getByRole('combobox')
    expect(moodSelect).toHaveValue('')
  })
})