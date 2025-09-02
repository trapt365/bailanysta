import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TRPCProvider } from '@/utils/trpc'
import SearchInput from '@/components/search/SearchInput'
import HashtagLink from '@/components/hashtag/HashtagLink'

// Mock tRPC
const mockSearchPosts = vi.fn()
const mockGetPopularHashtags = vi.fn()
const mockGetSuggestions = vi.fn()

vi.mock('@/utils/trpc', () => ({
  TRPCProvider: ({ children }: { children: React.ReactNode }) => children,
  trpc: {
    search: {
      posts: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          error: null,
        }),
        useInfiniteQuery: () => ({
          data: { pages: [] },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isLoading: false,
        }),
      },
      popularHashtags: {
        useQuery: () => ({
          data: [
            { hashtag: 'javascript', count: 10, recentUsage: new Date() },
            { hashtag: 'react', count: 8, recentUsage: new Date() },
            { hashtag: 'webdev', count: 6, recentUsage: new Date() },
          ],
          isLoading: false,
        }),
      },
      suggestions: {
        useQuery: () => ({
          data: ['javascript', 'react', 'nodejs'],
          isLoading: false,
        }),
      },
    },
    posts: {
      getByHashtag: {
        useInfiniteQuery: () => ({
          data: { pages: [] },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isLoading: false,
        }),
      },
    },
  },
}))

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/search',
}))

describe('Hashtag and Search Integration', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Search Flow', () => {
    it('performs complete search flow from input to results', async () => {
      render(
        <TRPCProvider>
          <SearchInput />
        </TRPCProvider>
      )

      const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
      
      // User types search query
      await user.type(searchInput, 'javascript')
      expect(searchInput).toHaveValue('javascript')
      
      // User presses Enter to search
      await user.type(searchInput, '{enter}')
      
      // Should navigate to search page with query
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/search?q=javascript')
      })
    })

    it('clears search and returns to default state', async () => {
      render(
        <TRPCProvider>
          <SearchInput />
        </TRPCProvider>
      )

      const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
      
      await user.type(searchInput, 'react')
      expect(searchInput).toHaveValue('react')
      
      // Click clear button
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)
      
      expect(searchInput).toHaveValue('')
    })
  })

  describe('Hashtag Navigation Flow', () => {
    it('navigates from hashtag to filtered results', async () => {
      render(
        <TRPCProvider>
          <HashtagLink hashtag="javascript" />
        </TRPCProvider>
      )

      const hashtagLink = screen.getByText('#javascript')
      await user.click(hashtagLink)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/hashtag/javascript')
      })
    })

    it('handles hashtag clicks with custom callback', async () => {
      const mockOnClick = vi.fn()
      
      render(
        <TRPCProvider>
          <HashtagLink hashtag="react" onClick={mockOnClick} />
        </TRPCProvider>
      )

      const hashtagLink = screen.getByText('#react')
      await user.click(hashtagLink)
      
      expect(mockOnClick).toHaveBeenCalledWith('react')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Cross-component Interactions', () => {
    it('allows searching for hashtags and navigating to hashtag pages', async () => {
      render(
        <TRPCProvider>
          <div>
            <SearchInput />
            <HashtagLink hashtag="javascript" />
            <HashtagLink hashtag="react" />
          </div>
        </TRPCProvider>
      )

      // Search for hashtag
      const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
      await user.type(searchInput, '#javascript{enter}')
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=%23javascript')
      
      // Then navigate to specific hashtag
      const hashtagLink = screen.getByText('#javascript')
      await user.click(hashtagLink)
      
      expect(mockPush).toHaveBeenCalledWith('/hashtag/javascript')
    })

    it('preserves search state across navigation', async () => {
      // Mock URL with search query
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
          replace: mockReplace,
        }),
        useSearchParams: () => new URLSearchParams('q=javascript'),
        usePathname: () => '/search',
      }))

      render(
        <TRPCProvider>
          <SearchInput />
        </TRPCProvider>
      )

      // Should show the search query from URL
      const searchInput = screen.getByDisplayValue('javascript')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('handles search errors gracefully', async () => {
      // Mock error state
      vi.mocked(vi.fn()).mockImplementation(() => ({
        data: null,
        isLoading: false,
        error: { message: 'Search failed' },
      }))

      render(
        <TRPCProvider>
          <SearchInput />
        </TRPCProvider>
      )

      const searchInput = screen.getByPlaceholderText('Search posts, users, hashtags...')
      await user.type(searchInput, 'test{enter}')
      
      // Should still attempt navigation even with API error
      expect(mockPush).toHaveBeenCalledWith('/search?q=test')
    })
  })

  describe('Loading States', () => {
    it('shows loading state during search', async () => {
      render(
        <TRPCProvider>
          <SearchInput isLoading />
        </TRPCProvider>
      )

      expect(screen.getByText(/searching/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation for search', async () => {
      render(
        <TRPCProvider>
          <SearchInput />
        </TRPCProvider>
      )

      const searchInput = screen.getByRole('textbox')
      
      // Focus with keyboard
      await user.tab()
      expect(searchInput).toHaveFocus()
      
      // Type and submit with keyboard
      await user.type(searchInput, 'accessibility test{enter}')
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=accessibility+test')
    })

    it('supports keyboard navigation for hashtags', async () => {
      render(
        <TRPCProvider>
          <HashtagLink hashtag="accessibility" />
        </TRPCProvider>
      )

      const hashtagButton = screen.getByRole('button')
      
      // Focus and activate with keyboard
      await user.tab()
      expect(hashtagButton).toHaveFocus()
      
      await user.keyboard('{enter}')
      expect(mockPush).toHaveBeenCalledWith('/hashtag/accessibility')
    })

    it('has proper ARIA labels and roles', () => {
      render(
        <TRPCProvider>
          <div>
            <SearchInput />
            <HashtagLink hashtag="test" />
          </div>
        </TRPCProvider>
      )

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /#test/i })).toBeInTheDocument()
    })
  })
})