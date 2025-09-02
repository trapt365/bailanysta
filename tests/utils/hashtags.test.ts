import { describe, it, expect } from 'vitest'
import {
  extractHashtags,
  validateHashtag,
  validateHashtagWithPrefix,
  normalizeHashtag,
  formatHashtagForDisplay,
  isValidHashtagFormat,
  extractSortedHashtags,
  countHashtagOccurrences,
  removeHashtagsFromContent,
  getHashtagSuggestions,
  legacyExtractHashtags
} from '@/utils/hashtags'

describe('hashtag utilities', () => {
  describe('extractHashtags', () => {
    it('extracts basic hashtags correctly', () => {
      const content = 'This is a post with #coding and #javascript hashtags'
      const result = extractHashtags(content)
      expect(result).toEqual(['coding', 'javascript'])
    })

    it('handles hashtags with underscores', () => {
      const content = 'Learning #web_development and #machine_learning'
      const result = extractHashtags(content)
      expect(result).toEqual(['web_development', 'machine_learning'])
    })

    it('extracts hashtags at word boundaries only', () => {
      const content = 'Email me at test@example.com #coding'
      const result = extractHashtags(content)
      expect(result).toEqual(['coding'])
    })

    it('handles hashtags at start, middle, and end of text', () => {
      const content = '#start middle #middle end #end'
      const result = extractHashtags(content)
      expect(result).toEqual(['start', 'middle', 'end'])
    })

    it('deduplicates hashtags', () => {
      const content = '#coding is fun #CODING is great #Coding rocks'
      const result = extractHashtags(content)
      expect(result).toEqual(['coding']) // Should deduplicate and normalize
    })

    it('ignores hashtags longer than 50 characters', () => {
      const longHashtag = '#' + 'a'.repeat(51)
      const validHashtag = '#' + 'b'.repeat(50)
      const content = `Test ${longHashtag} and ${validHashtag}`
      const result = extractHashtags(content)
      expect(result).toEqual(['b'.repeat(50)])
    })

    it('handles empty or invalid content', () => {
      expect(extractHashtags('')).toEqual([])
      expect(extractHashtags(null as any)).toEqual([])
      expect(extractHashtags(undefined as any)).toEqual([])
      expect(extractHashtags('No hashtags here')).toEqual([])
    })

    it('ignores hashtags with special characters', () => {
      const content = '#valid #invalid-tag #invalid@tag #invalid.tag #also_valid'
      const result = extractHashtags(content)
      expect(result).toEqual(['valid', 'also_valid'])
    })

    it('handles hashtags followed by punctuation', () => {
      const content = 'Love #coding! And #javascript. Also #react?'
      const result = extractHashtags(content)
      expect(result).toEqual(['coding', 'javascript', 'react'])
    })

    it('handles hashtags in newlines and multiple spaces', () => {
      const content = `First line #coding
      Second line with    #javascript    
      #react on new line`
      const result = extractHashtags(content)
      expect(result).toEqual(['coding', 'javascript', 'react'])
    })
  })

  describe('validateHashtag', () => {
    it('validates correct hashtags', () => {
      const result = validateHashtag('coding')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('validates hashtags with underscores', () => {
      const result = validateHashtag('web_development')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('validates hashtags with numbers', () => {
      const result = validateHashtag('react18')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('rejects empty hashtags', () => {
      const result = validateHashtag('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Hashtag cannot be empty')
    })

    it('rejects hashtags that are too long', () => {
      const longHashtag = 'a'.repeat(51)
      const result = validateHashtag(longHashtag)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Hashtag cannot exceed 50 characters')
    })

    it('rejects hashtags with special characters', () => {
      const result = validateHashtag('invalid-tag')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Hashtag can only contain letters, numbers, and underscores')
    })

    it('rejects hashtags starting or ending with underscore', () => {
      const startResult = validateHashtag('_invalid')
      expect(startResult.isValid).toBe(false)
      expect(startResult.errors).toContain('Hashtag cannot start or end with underscore')

      const endResult = validateHashtag('invalid_')
      expect(endResult.isValid).toBe(false)
      expect(endResult.errors).toContain('Hashtag cannot start or end with underscore')
    })
  })

  describe('validateHashtagWithPrefix', () => {
    it('validates hashtags with # prefix', () => {
      const result = validateHashtagWithPrefix('#coding')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('rejects hashtags without # prefix', () => {
      const result = validateHashtagWithPrefix('coding')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Hashtag must start with #')
    })

    it('validates the hashtag part after prefix', () => {
      const result = validateHashtagWithPrefix('#invalid-tag')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Hashtag can only contain letters, numbers, and underscores')
    })
  })

  describe('normalizeHashtag', () => {
    it('normalizes hashtags with prefix', () => {
      expect(normalizeHashtag('#Coding')).toBe('coding')
      expect(normalizeHashtag('#JavaScript')).toBe('javascript')
    })

    it('normalizes hashtags without prefix', () => {
      expect(normalizeHashtag('Coding')).toBe('coding')
      expect(normalizeHashtag('JavaScript')).toBe('javascript')
    })

    it('handles whitespace', () => {
      expect(normalizeHashtag('  #Coding  ')).toBe('coding')
      expect(normalizeHashtag('  JavaScript  ')).toBe('javascript')
    })
  })

  describe('formatHashtagForDisplay', () => {
    it('adds # prefix when missing', () => {
      expect(formatHashtagForDisplay('coding')).toBe('#coding')
      expect(formatHashtagForDisplay('javascript')).toBe('#javascript')
    })

    it('preserves # prefix when present', () => {
      expect(formatHashtagForDisplay('#coding')).toBe('#coding')
      expect(formatHashtagForDisplay('#JavaScript')).toBe('#javascript') // Should normalize
    })
  })

  describe('isValidHashtagFormat', () => {
    it('validates correct hashtag formats', () => {
      expect(isValidHashtagFormat('#coding')).toBe(true)
      expect(isValidHashtagFormat('#web_development')).toBe(true)
      expect(isValidHashtagFormat('#react18')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(isValidHashtagFormat('coding')).toBe(false) // No #
      expect(isValidHashtagFormat('#')).toBe(false) // Too short
      expect(isValidHashtagFormat('#invalid-tag')).toBe(false) // Contains dash
      expect(isValidHashtagFormat('#' + 'a'.repeat(51))).toBe(false) // Too long
    })
  })

  describe('extractSortedHashtags', () => {
    it('extracts and sorts hashtags alphabetically', () => {
      const content = 'Learning #react #javascript #coding #angular'
      const result = extractSortedHashtags(content)
      expect(result).toEqual(['angular', 'coding', 'javascript', 'react'])
    })
  })

  describe('countHashtagOccurrences', () => {
    it('counts hashtag occurrences correctly', () => {
      const content = '#coding is fun and #coding is great. #CODING rocks!'
      const count = countHashtagOccurrences(content, 'coding')
      expect(count).toBe(3) // Should be case-insensitive
    })

    it('handles hashtag not found', () => {
      const content = 'No hashtags here'
      const count = countHashtagOccurrences(content, 'coding')
      expect(count).toBe(0)
    })
  })

  describe('removeHashtagsFromContent', () => {
    it('removes hashtags from content', () => {
      const content = 'This is #coding content with #javascript hashtags'
      const result = removeHashtagsFromContent(content)
      expect(result).toBe('This is content with hashtags')
    })

    it('handles multiple spaces after hashtag removal', () => {
      const content = 'Start #hashtag    end'
      const result = removeHashtagsFromContent(content)
      expect(result).toBe('Start end')
    })
  })

  describe('getHashtagSuggestions', () => {
    const existingHashtags = ['coding', 'javascript', 'react', 'reactnative', 'java', 'python']

    it('returns suggestions based on input prefix', () => {
      const suggestions = getHashtagSuggestions('ja', existingHashtags)
      expect(suggestions).toEqual(['javascript', 'java'])
    })

    it('returns suggestions for react prefix', () => {
      const suggestions = getHashtagSuggestions('react', existingHashtags)
      expect(suggestions).toEqual(['reactnative'])
    })

    it('handles case insensitive matching', () => {
      const suggestions = getHashtagSuggestions('JA', existingHashtags)
      expect(suggestions).toEqual(['javascript', 'java'])
    })

    it('excludes exact matches', () => {
      const suggestions = getHashtagSuggestions('java', existingHashtags)
      expect(suggestions).toEqual(['javascript'])
    })

    it('limits results', () => {
      const manyHashtags = Array.from({length: 20}, (_, i) => `tag${i}`)
      const suggestions = getHashtagSuggestions('tag', manyHashtags, 5)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('returns empty array for short input', () => {
      const suggestions = getHashtagSuggestions('', existingHashtags)
      expect(suggestions).toEqual([])
    })
  })

  describe('legacyExtractHashtags', () => {
    it('maintains compatibility with old implementation', () => {
      const content = 'Testing #hashtag #extraction #test'
      const result = legacyExtractHashtags(content)
      expect(result).toEqual(['hashtag', 'extraction', 'test'])
    })

    it('uses simple regex like original', () => {
      const content = 'Email test@example.com #valid'
      const result = legacyExtractHashtags(content)
      expect(result).toEqual(['valid'])
    })
  })
})