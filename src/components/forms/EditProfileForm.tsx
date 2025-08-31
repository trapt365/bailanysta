'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Textarea } from '@/components/ui'
import { updateUserSchema, validateUsername, validateBio } from '@/utils/validation'
import { UpdateUserInput } from '@/types/shared'

interface EditProfileFormProps {
  user: {
    username: string
    bio: string
  }
  onSubmit: (data: { username: string; bio: string }) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export default function EditProfileForm({ 
  user, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: EditProfileFormProps) {
  const [bioCharacterCount, setBioCharacterCount] = useState(user.bio.length)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    mode: 'onChange',
    defaultValues: {
      username: user.username,
      bio: user.bio
    }
  })
  
  // Watch bio field for character counting
  const bio = watch('bio', user.bio)
  
  React.useEffect(() => {
    setBioCharacterCount(bio?.length || 0)
  }, [bio])
  
  const handleFormSubmit = async (data: UpdateUserInput) => {
    try {
      await onSubmit({
        username: data.username || user.username,
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }
  
  const getBioCharacterCountColor = () => {
    if (bioCharacterCount > 200) return 'text-red-600'
    if (bioCharacterCount > 180) return 'text-yellow-600'
    return 'text-gray-500'
  }
  
  const remainingBioCharacters = 200 - bioCharacterCount
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Username Field */}
      <div className="space-y-2">
        <Input
          {...register('username')}
          label="Username"
          placeholder="Enter your username"
          error={errors.username?.message}
          disabled={isSubmitting}
          maxLength={50}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This is how your name will appear on posts and comments.
        </p>
      </div>

      {/* Bio Field */}
      <div className="space-y-2">
        <Textarea
          {...register('bio')}
          label="Bio"
          placeholder="Tell us a little about yourself (optional)"
          rows={4}
          error={errors.bio?.message}
          disabled={isSubmitting}
          maxLength={200}
        />
        
        {/* Bio character counter */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Optional. Describe yourself in a few words.
          </p>
          <div className={`text-xs font-medium ${getBioCharacterCountColor()}`}>
            {remainingBioCharacters} characters remaining
          </div>
        </div>
        
        {/* Visual indicator for bio character limit */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-200 ${
              bioCharacterCount > 200 
                ? 'bg-red-500' 
                : bioCharacterCount > 180 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min((bioCharacterCount / 200) * 100, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isValid || !isDirty || bioCharacterCount > 200}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}