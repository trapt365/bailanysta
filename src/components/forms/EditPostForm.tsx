'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Textarea } from '@/components/ui'
import { updatePostSchema } from '@/utils/validation'
import { UpdatePostInput, Post } from '@/types/shared'

interface EditPostFormProps {
  post: Post
  onSave: (data: UpdatePostInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function EditPostForm({ 
  post, 
  onSave, 
  onCancel, 
  isLoading = false 
}: EditPostFormProps) {
  const [characterCount, setCharacterCount] = useState(post.content.length)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    mode: 'onChange',
    defaultValues: {
      id: post.id,
      content: post.content,
      mood: post.mood
    }
  })
  
  // Watch content field for character counting
  const content = watch('content', post.content)
  
  React.useEffect(() => {
    setCharacterCount(content.length)
  }, [content])
  
  const handleFormSubmit = async (data: UpdatePostInput) => {
    try {
      await onSave(data)
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error)
    }
  }
  
  const getCharacterCountColor = () => {
    if (characterCount > 280) return 'text-red-600'
    if (characterCount > 250) return 'text-yellow-600'
    return 'text-gray-500'
  }
  
  const remainingCharacters = 280 - characterCount
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Edit Post</h3>
        <span className="text-xs text-gray-500">
          Last updated: {new Date(post.updatedAt).toLocaleDateString()}
        </span>
      </div>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            {...register('content')}
            placeholder="What's on your mind?"
            rows={4}
            className="text-base resize-none"
            error={errors.content?.message}
            disabled={isLoading}
            autoFocus
          />
          
          {/* Character counter */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {/* Mood selector - preserve existing mood */}
              <select
                {...register('mood')}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white disabled:bg-gray-50"
                disabled={isLoading}
              >
                <option value="">Select mood (optional)</option>
                <option value="Happy">😊 Happy</option>
                <option value="Thoughtful">🤔 Thoughtful</option>
                <option value="Excited">🎉 Excited</option>
                <option value="Contemplative">🧘 Contemplative</option>
                <option value="Energetic">⚡ Energetic</option>
              </select>
            </div>
            
            <div className={`text-sm font-medium ${getCharacterCountColor()}`}>
              {remainingCharacters} characters remaining
            </div>
          </div>
          
          {/* Visual indicator for character limit */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-200 ${
                characterCount > 280 
                  ? 'bg-red-500' 
                  : characterCount > 250 
                  ? 'bg-yellow-500' 
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((characterCount / 280) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            loading={isLoading}
            disabled={!isValid || !isDirty || characterCount === 0 || characterCount > 280}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}