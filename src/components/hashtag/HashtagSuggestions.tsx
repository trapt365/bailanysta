'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { trpc } from '@/utils/trpc'
import { extractHashtags } from '@/utils/hashtags'

interface HashtagSuggestionsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  content: string
  onContentChange: (content: string) => void
  className?: string
}

interface Suggestion {
  hashtag: string
  count: number
}

/**
 * Hashtag suggestions component for post creation
 * Provides real-time hashtag autocomplete with keyboard navigation
 */
export default function HashtagSuggestions({
  textareaRef,
  content,
  onContentChange,
  className = ''
}: HashtagSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [currentHashtagInput, setCurrentHashtagInput] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Get popular hashtags for suggestions
  const { data: popularHashtags = [] } = trpc.search.popularHashtags.useQuery(
    { limit: 10 },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Extract current hashtags from content
  const currentHashtags = extractHashtags(content)

  // Detect hashtag being typed
  const detectCurrentHashtag = useCallback((text: string, cursorPos: number) => {
    if (!textareaRef.current) return null

    // Find the last # before cursor position
    let hashtagStart = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '#') {
        hashtagStart = i
        break
      }
      if (text[i] === ' ' || text[i] === '\n') {
        break
      }
    }

    if (hashtagStart === -1) return null

    // Find the end of the hashtag (space, newline, or end of text)
    let hashtagEnd = cursorPos
    for (let i = hashtagStart + 1; i < text.length && i <= cursorPos; i++) {
      if (text[i] === ' ' || text[i] === '\n') {
        hashtagEnd = i
        break
      }
      if (i === cursorPos) {
        hashtagEnd = i
        break
      }
    }

    // Extract the hashtag being typed
    const hashtag = text.slice(hashtagStart + 1, hashtagEnd)
    
    // Only show suggestions if hashtag is being actively typed
    if (cursorPos >= hashtagStart + 1 && cursorPos <= hashtagEnd) {
      return {
        hashtag,
        start: hashtagStart,
        end: hashtagEnd
      }
    }

    return null
  }, [textareaRef])

  // Get filtered suggestions
  const getFilteredSuggestions = useCallback((input: string): Suggestion[] => {
    if (!input || input.length < 1) {
      return popularHashtags.slice(0, 5)
    }

    const normalizedInput = input.toLowerCase()
    
    // Filter popular hashtags that match the input
    const matchingSuggestions = popularHashtags
      .filter(({ hashtag }) => {
        const normalizedHashtag = hashtag.toLowerCase()
        return normalizedHashtag.startsWith(normalizedInput) && 
               normalizedHashtag !== normalizedInput &&
               !currentHashtags.some(tag => tag.toLowerCase() === normalizedHashtag)
      })
      .slice(0, 8)

    return matchingSuggestions
  }, [popularHashtags, currentHashtags])

  // Handle cursor position updates
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleSelectionChange = () => {
      const cursorPos = textarea.selectionStart
      setCursorPosition(cursorPos)
      
      const currentHashtag = detectCurrentHashtag(content, cursorPos)
      
      if (currentHashtag) {
        setCurrentHashtagInput(currentHashtag.hashtag)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } else {
        setCurrentHashtagInput('')
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    // Listen for cursor position changes
    textarea.addEventListener('keyup', handleSelectionChange)
    textarea.addEventListener('mouseup', handleSelectionChange)
    textarea.addEventListener('focus', handleSelectionChange)

    return () => {
      textarea.removeEventListener('keyup', handleSelectionChange)
      textarea.removeEventListener('mouseup', handleSelectionChange)
      textarea.removeEventListener('focus', handleSelectionChange)
    }
  }, [content, detectCurrentHashtag, textareaRef])

  // Handle keyboard navigation
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !showSuggestions) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return

      const suggestions = getFilteredSuggestions(currentHashtagInput)
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
          
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
          
        case 'Enter':
        case 'Tab':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault()
            applySuggestion(suggestions[selectedIndex].hashtag)
          }
          break
          
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          setSelectedIndex(-1)
          break
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    return () => textarea.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, selectedIndex, currentHashtagInput, getFilteredSuggestions])

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const currentHashtag = detectCurrentHashtag(content, cursorPosition)
    
    if (!currentHashtag) return

    // Replace the current hashtag with the suggestion
    const newContent = 
      content.slice(0, currentHashtag.start + 1) + 
      suggestion + 
      content.slice(currentHashtag.end)

    onContentChange(newContent)
    
    // Set cursor position after the inserted hashtag
    const newCursorPos = currentHashtag.start + 1 + suggestion.length
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)

    setShowSuggestions(false)
    setSelectedIndex(-1)
  }, [content, cursorPosition, detectCurrentHashtag, onContentChange, textareaRef])

  // Get textarea position for suggestions dropdown
  const getDropdownPosition = useCallback(() => {
    if (!textareaRef.current || !showSuggestions) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const currentHashtag = detectCurrentHashtag(content, cursorPosition)
    
    if (!currentHashtag) return { top: 0, left: 0 }

    // Create a temporary div to measure text position
    const textMetrics = document.createElement('div')
    textMetrics.style.position = 'absolute'
    textMetrics.style.visibility = 'hidden'
    textMetrics.style.whiteSpace = 'pre-wrap'
    textMetrics.style.font = window.getComputedStyle(textarea).font
    textMetrics.style.padding = window.getComputedStyle(textarea).padding
    textMetrics.style.border = window.getComputedStyle(textarea).border
    textMetrics.style.width = `${textarea.clientWidth}px`
    
    // Get text up to hashtag position
    const textBeforeHashtag = content.slice(0, currentHashtag.start)
    textMetrics.textContent = textBeforeHashtag
    
    document.body.appendChild(textMetrics)
    
    const textRect = textMetrics.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()
    
    document.body.removeChild(textMetrics)
    
    return {
      top: textRect.height + 4,
      left: textRect.width - textareaRect.width + textarea.offsetLeft
    }
  }, [content, cursorPosition, detectCurrentHashtag, showSuggestions, textareaRef])

  if (!showSuggestions || !currentHashtagInput) return null

  const suggestions = getFilteredSuggestions(currentHashtagInput)
  
  if (suggestions.length === 0) return null

  const dropdownPosition = getDropdownPosition()

  return (
    <div 
      ref={suggestionsRef}
      className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto ${className}`}
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${Math.max(0, dropdownPosition.left)}px`,
        minWidth: '200px',
        maxWidth: '300px'
      }}
    >
      <div className="p-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
          Hashtag suggestions
        </div>
        
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.hashtag}
            type="button"
            onClick={() => applySuggestion(suggestion.hashtag)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 flex items-center justify-between ${
              index === selectedIndex
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="font-medium">#{suggestion.hashtag}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {suggestion.count} posts
            </span>
          </button>
        ))}
        
        <div className="text-xs text-gray-400 dark:text-gray-600 mt-2 px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  )
}