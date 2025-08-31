import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditProfileForm from '@/components/forms/EditProfileForm'

describe('EditProfileForm Component', () => {
  const mockUser = {
    username: 'Test User',
    bio: 'This is a test bio'
  }

  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form with initial user data', () => {
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('This is a test bio')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should update character count when typing in bio field', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={{ username: 'Test User', bio: '' }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const bioTextarea = screen.getByLabelText('Bio')
    
    await user.type(bioTextarea, 'New bio content')
    
    await waitFor(() => {
      expect(screen.getByText(/184 characters remaining/)).toBeInTheDocument()
    })
  })

  it('should validate username field', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const usernameInput = screen.getByLabelText('Username')
    
    // Clear the field
    await user.clear(usernameInput)
    
    // Try to submit empty form
    const saveButton = screen.getByText('Save Changes')
    expect(saveButton).toBeDisabled()
  })

  it('should validate bio character limit', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={{ username: 'Test User', bio: '' }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const bioTextarea = screen.getByLabelText('Bio')
    const longBio = 'a'.repeat(201) // Exceed 200 character limit
    
    await user.type(bioTextarea, longBio)
    
    await waitFor(() => {
      expect(screen.getByText(/-1 characters remaining/)).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeDisabled()
    })
  })

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const usernameInput = screen.getByLabelText('Username')
    const bioTextarea = screen.getByLabelText('Bio')
    const saveButton = screen.getByText('Save Changes')

    await user.clear(usernameInput)
    await user.type(usernameInput, 'Updated User')
    
    await user.clear(bioTextarea)
    await user.type(bioTextarea, 'Updated bio content')

    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'Updated User',
        bio: 'Updated bio content'
      })
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should disable form when submitting', () => {
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    )

    expect(screen.getByLabelText('Username')).toBeDisabled()
    expect(screen.getByLabelText('Bio')).toBeDisabled()
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })

  it('should show character count colors based on bio length', async () => {
    const user = userEvent.setup()
    
    render(
      <EditProfileForm
        user={{ username: 'Test User', bio: '' }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const bioTextarea = screen.getByLabelText('Bio')
    
    // Normal length
    await user.type(bioTextarea, 'Short bio')
    await waitFor(() => {
      const counter = screen.getByText(/characters remaining/)
      expect(counter).toHaveClass('text-gray-500')
    })

    // Clear and type warning length
    await user.clear(bioTextarea)
    await user.type(bioTextarea, 'a'.repeat(190))
    await waitFor(() => {
      const counter = screen.getByText(/characters remaining/)
      expect(counter).toHaveClass('text-yellow-600')
    })

    // Clear and type over limit
    await user.clear(bioTextarea)
    await user.type(bioTextarea, 'a'.repeat(201))
    await waitFor(() => {
      const counter = screen.getByText(/characters remaining/)
      expect(counter).toHaveClass('text-red-600')
    })
  })

  it('should not enable save button if form has not been modified', () => {
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const saveButton = screen.getByText('Save Changes')
    expect(saveButton).toBeDisabled()
  })

  it('should show helper text for form fields', () => {
    render(
      <EditProfileForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('This is how your name will appear on posts and comments.')).toBeInTheDocument()
    expect(screen.getByText('Optional. Describe yourself in a few words.')).toBeInTheDocument()
  })
})