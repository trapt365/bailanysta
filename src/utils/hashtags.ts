// Enhanced hashtag extraction and processing utilities
// Following the story requirements for hashtag format validation and extraction

export interface HashtagValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Enhanced hashtag extraction with proper regex parsing
 * Supports alphanumeric + underscore, proper word boundaries
 * Regex: #([a-zA-Z0-9_]+)(?=\s|$|[^\w]) - matches hashtag with word boundary
 */
export const extractHashtags = (content: string): string[] => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Enhanced regex for hashtag extraction: word boundaries, alphanumeric + underscore
  const hashtagRegex = /#([a-zA-Z0-9_]+)(?=\s|$|[^\w])/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # symbol, normalize to lowercase, and deduplicate
  const hashtags = matches
    .map(tag => tag.slice(1).toLowerCase()) // Remove # and lowercase
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // Deduplicate
    .filter(tag => tag.length > 0 && tag.length <= 50) // Validation: 1-50 chars
    .filter(tag => /^[a-zA-Z0-9_]+$/.test(tag)); // Additional validation for format
    
  return hashtags;
};

/**
 * Validate hashtag format according to platform rules
 * Must start with letter/number, can contain underscore, 1-50 characters
 */
export const validateHashtag = (hashtag: string): HashtagValidationResult => {
  const errors: string[] = [];
  
  if (!hashtag) {
    errors.push('Hashtag cannot be empty');
    return { isValid: false, errors };
  }
  
  if (hashtag.length < 1) {
    errors.push('Hashtag must be at least 1 character long');
  }
  
  if (hashtag.length > 50) {
    errors.push('Hashtag cannot exceed 50 characters');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(hashtag)) {
    errors.push('Hashtag can only contain letters, numbers, and underscores');
  }
  
  if (/^_/.test(hashtag) || /_$/.test(hashtag)) {
    errors.push('Hashtag cannot start or end with underscore');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate hashtag format with # prefix
 */
export const validateHashtagWithPrefix = (hashtagWithPrefix: string): HashtagValidationResult => {
  if (!hashtagWithPrefix.startsWith('#')) {
    return { 
      isValid: false, 
      errors: ['Hashtag must start with #'] 
    };
  }
  
  const hashtag = hashtagWithPrefix.slice(1);
  return validateHashtag(hashtag);
};

/**
 * Normalize hashtag by removing # prefix and converting to lowercase
 */
export const normalizeHashtag = (hashtag: string): string => {
  const cleaned = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
  return cleaned.toLowerCase().trim();
};

/**
 * Format hashtag for display (adds # prefix if missing)
 */
export const formatHashtagForDisplay = (hashtag: string): string => {
  const normalized = normalizeHashtag(hashtag);
  return `#${normalized}`;
};

/**
 * Check if a string is a valid hashtag format
 */
export const isValidHashtagFormat = (text: string): boolean => {
  // Check if text matches hashtag pattern exactly
  return /^#[a-zA-Z0-9_]+$/.test(text) && text.length >= 2 && text.length <= 51;
};

/**
 * Extract unique hashtags from content and sort them alphabetically
 */
export const extractSortedHashtags = (content: string): string[] => {
  const hashtags = extractHashtags(content);
  return hashtags.sort();
};

/**
 * Count hashtag occurrences in text
 */
export const countHashtagOccurrences = (content: string, hashtag: string): number => {
  const normalizedHashtag = normalizeHashtag(hashtag);
  const regex = new RegExp(`#${normalizedHashtag}(?=\\s|$|[^\\w])`, 'gi');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

/**
 * Remove hashtags from content text (for plain text display)
 */
export const removeHashtagsFromContent = (content: string): string => {
  return content.replace(/#[a-zA-Z0-9_]+/g, '').replace(/\s+/g, ' ').trim();
};

/**
 * Get hashtag suggestions based on input and existing hashtags
 * Used for autocomplete functionality
 */
export const getHashtagSuggestions = (
  input: string,
  existingHashtags: string[],
  limit: number = 10
): string[] => {
  const normalizedInput = normalizeHashtag(input);
  
  if (normalizedInput.length < 1) {
    return [];
  }
  
  // Find hashtags that start with the input
  const suggestions = existingHashtags
    .filter(hashtag => normalizeHashtag(hashtag).startsWith(normalizedInput))
    .filter(hashtag => normalizeHashtag(hashtag) !== normalizedInput) // Exclude exact match
    .slice(0, limit);
    
  return [...new Set(suggestions)]; // Deduplicate
};

/**
 * Legacy compatibility function - maintains existing API
 * @deprecated Use extractHashtags instead for enhanced functionality
 */
export const legacyExtractHashtags = (content: string): string[] => {
  const hashtags = content.match(/#[\w]+/g) || [];
  return hashtags.map(tag => tag.slice(1).toLowerCase());
};