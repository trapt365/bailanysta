import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PostCard from '@/components/feed/PostCard'
import { trpc } from '@/utils/trpc'
import { Post } from '@/types/shared'

// Mock tRPC
vi.mock('@/utils/trpc', () => ({
  trpc: {
    reactions: {
      hasUserReacted: {
        useQuery: vi.fn()
      }
    }
  }
}))

// Mock ReactionButton component
vi.mock('@/components/feed/ReactionButton', () => ({
  default: ({ post, onUpdate, isLiked }: any) => (
    <button 
      data-testid="reaction-button"
      data-liked={isLiked}
      onClick={() => onUpdate?.(post)}
    >
      {isLiked ? 'Unlike' : 'Like'} ({post.reactionCount})
    </button>
  )
}))

// Mock icons
vi.mock('@/components/ui/icons', () => ({
  MessageIcon: ({ className }: { className?: string }) => (
    <div data-testid="message-icon" className={className} />
  )
}))

describe('PostCard', () => {
  let mockPost: Post
  let mockOnUpdate: ReturnType<typeof vi.fn>
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockPost = {
      id: 'test-post-id',
      content: 'This is a test post with some #hashtags and content!',
      authorId: 'author-id',
      authorName: 'John Doe',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
      mood: 'Happy',
      hashtags: ['hashtags', 'content'],
      reactionCount: 5,
      commentCount: 3
    }

    mockOnUpdate = vi.fn()

    // Mock the tRPC query
    vi.mocked(trpc.reactions.hasUserReacted.useQuery).mockReturnValue({
      data: false,
      isLoading: false,
      isError: false,
      error: null
    } as any)
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should render post content correctly', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('This is a test post with some #hashtags and content!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('@johndoe')).toBeInTheDocument()
  })

  it('should display author avatar with initial', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    const avatar = screen.getByText('J')
    expect(avatar).toBeInTheDocument()
    expect(avatar.closest('div')).toHaveClass('bg-blue-600', 'rounded-full')
  })

  it('should display formatted date correctly', () => {
    // Mock current date to be one hour after post creation
    const mockNow = new Date('2024-01-15T11:30:00Z')
    vi.setSystemTime(mockNow)

    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('1h')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should display mood emoji when mood is present', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByTitle('Feeling Happy')).toBeInTheDocument()
  })

  it('should not display mood when mood is not present', () => {
    const postWithoutMood = { ...mockPost, mood: undefined }
    renderWithProviders(<PostCard post={postWithoutMood} onUpdate={mockOnUpdate} />)

    expect(screen.queryByText('😊')).not.toBeInTheDocument()
  })

  it('should display hashtags as clickable elements', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    const hashtagElements = screen.getAllByText(/#\w+/)
    expect(hashtagElements).toHaveLength(2)
    
    expect(screen.getByText('#hashtags')).toBeInTheDocument()
    expect(screen.getByText('#content')).toBeInTheDocument()
    
    // Check if hashtags have proper styling
    hashtagElements.forEach(element => {
      expect(element).toHaveClass('text-blue-600', 'cursor-pointer')
    })
  })

  it('should display comment count', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByTestId('message-icon')).toBeInTheDocument()
  })

  it('should render ReactionButton with correct props', () => {
    vi.mocked(trpc.reactions.hasUserReacted.useQuery).mockReturnValue({
      data: true,
      isLoading: false,
      isError: false,
      error: null
    } as any)

    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    const reactionButton = screen.getByTestId('reaction-button')
    expect(reactionButton).toBeInTheDocument()
    expect(reactionButton).toHaveAttribute('data-liked', 'true')
    expect(reactionButton).toHaveTextContent('Unlike (5)')
  })

  it('should call onUpdate when ReactionButton triggers update', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    const reactionButton = screen.getByTestId('reaction-button')
    await user.click(reactionButton)

    expect(mockOnUpdate).toHaveBeenCalledWith(mockPost)
  })

  it('should handle different time formats correctly', () => {
    const testCases = [
      { 
        postDate: new Date('2024-01-15T10:29:30Z'), 
        currentDate: new Date('2024-01-15T10:30:00Z'), 
        expected: 'now' 
      },
      { 
        postDate: new Date('2024-01-15T10:00:00Z'), 
        currentDate: new Date('2024-01-15T10:30:00Z'), 
        expected: '30m' 
      },
      { 
        postDate: new Date('2024-01-15T08:00:00Z'), 
        currentDate: new Date('2024-01-15T10:30:00Z'), 
        expected: '2h' 
      },
      { 
        postDate: new Date('2024-01-13T10:30:00Z'), 
        currentDate: new Date('2024-01-15T10:30:00Z'), 
        expected: '2d' 
      },
      { 
        postDate: new Date('2024-01-01T10:30:00Z'), 
        currentDate: new Date('2024-01-15T10:30:00Z'), 
        expected: '1/1/2024' 
      }
    ]

    testCases.forEach(({ postDate, currentDate, expected }) => {
      vi.setSystemTime(currentDate)
      
      const { unmount } = renderWithProviders(
        <PostCard 
          post={{ ...mockPost, createdAt: postDate }} 
          onUpdate={mockOnUpdate} 
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
      
      unmount()
    })

    vi.useRealTimers()
  })

  it('should have proper semantic HTML structure', () => {
    renderWithProviders(<PostCard post={mockPost} onUpdate={mockOnUpdate} />)

    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()

    const timeElement = screen.getByRole('time')
    expect(timeElement).toHaveAttribute('dateTime', mockPost.createdAt.toISOString())
  })

  it('should handle posts without hashtags', () => {
    const postWithoutHashtags = { ...mockPost, hashtags: [] }
    renderWithProviders(<PostCard post={postWithoutHashtags} onUpdate={mockOnUpdate} />)

    expect(screen.queryByText(/#\w+/)).not.toBeInTheDocument()
  })

  it('should display all mood emojis correctly', () => {
    const moodTests = [
      { mood: 'Happy' as const, emoji: '😊' },
      { mood: 'Thoughtful' as const, emoji: '🤔' },
      { mood: 'Excited' as const, emoji: '🎉' },
      { mood: 'Contemplative' as const, emoji: '🧘' },
      { mood: 'Energetic' as const, emoji: '⚡' }
    ]

    moodTests.forEach(({ mood, emoji }) => {
      const { unmount } = renderWithProviders(
        <PostCard 
          post={{ ...mockPost, mood }} 
          onUpdate={mockOnUpdate} 
        />
      )

      expect(screen.getByText(emoji)).toBeInTheDocument()
      expect(screen.getByTitle(`Feeling ${mood}`)).toBeInTheDocument()
      
      unmount()
    })
  })

  it('should handle long author names correctly', () => {
    const postWithLongName = { 
      ...mockPost, 
      authorName: 'This Is A Very Long Author Name That Should Be Truncated' 
    }
    
    renderWithProviders(<PostCard post={postWithLongName} onUpdate={mockOnUpdate} />)

    const authorName = screen.getByText(postWithLongName.authorName)
    expect(authorName).toHaveClass('truncate')
  })

  it('should preserve whitespace in post content', () => {
    const postWithWhitespace = { 
      ...mockPost, 
      content: 'Line 1\n\nLine 2 with  extra  spaces' 
    }
    
    renderWithProviders(<PostCard post={postWithWhitespace} onUpdate={mockOnUpdate} />)

    const content = screen.getByText(postWithWhitespace.content)
    expect(content).toHaveClass('whitespace-pre-wrap')
  })

  it('should handle posts with zero reaction and comment counts', () => {
    const postWithZeroCounts = { 
      ...mockPost, 
      reactionCount: 0,
      commentCount: 0
    }
    
    renderWithProviders(<PostCard post={postWithZeroCounts} onUpdate={mockOnUpdate} />)

    expect(screen.getByText('Like (0)')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})