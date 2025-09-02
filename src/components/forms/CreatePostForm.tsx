'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Textarea } from '@/components/ui'
import LoadingButton from '@/components/ui/LoadingButton'
import { createPostSchema } from '@/utils/validation'
import { CreatePostInput } from '@/types/shared'
import { HashtagSuggestions } from '@/components/hashtag'

interface CreatePostFormProps {
  onSubmit: (data: CreatePostInput) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export default function CreatePostForm({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: CreatePostFormProps) {
  const [characterCount, setCharacterCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid }
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    mode: 'onChange',
    defaultValues: {
      content: '',
      mood: undefined
    }
  })
  
  // Watch content field for character counting
  const content = watch('content', '')
  
  React.useEffect(() => {
    setCharacterCount(content.length)
  }, [content])
  
  const handleFormSubmit = async (data: CreatePostInput) => {
    try {
      await onSubmit(data)
      reset() // Clear form after successful submission
      setCharacterCount(0)
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error)
    }
  }

  // Handle content changes from hashtag suggestions
  const handleContentChange = (newContent: string) => {
    setValue('content', newContent, { shouldValidate: true })
  }
  
  const getCharacterCountColor = () => {
    if (characterCount > 280) return 'text-red-600'
    if (characterCount > 250) return 'text-yellow-600'
    return 'text-gray-500'
  }
  
  const remainingCharacters = 280 - characterCount
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2 relative">
        <div className="relative">
          <Textarea
            {...register('content')}
            ref={textareaRef}
            placeholder="What's on your mind? Use #hashtags to categorize your post!"
            rows={4}
            className="text-lg"
            error={errors.content?.message}
            disabled={isSubmitting}
          />
          
          {/* Hashtag Suggestions */}
          <HashtagSuggestions
            textareaRef={textareaRef}
            content={content}
            onContentChange={handleContentChange}
          />
        </div>
        
        {/* Character counter */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Mood selector - optional feature */}
            <select
              {...register('mood')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
              disabled={isSubmitting}
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
      <div className="flex justify-end space-x-2">
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
        
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Publishing..."
          disabled={!isValid || characterCount === 0 || characterCount > 280}
        >
          Publish Post
        </LoadingButton>
      </div>
    </form>
  )
}