import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme } from '@/hooks/useTheme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  }
}

// Mock window.matchMedia
const matchMediaMock = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(global, 'document', {
  value: {
    documentElement: documentElementMock
  }
})

Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn(() => matchMediaMock)
  }
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.matches = false
  })

  it('should initialize with system theme when no stored preference', () => {
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('should use stored theme preference from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      // Trigger initialization
      result.current.setTheme('dark')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preference', 'dark')
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should toggle between light and dark themes', () => {
    const { result } = renderHook(() => useTheme())
    
    // Start with light theme
    act(() => {
      result.current.setTheme('light')
    })
    
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    
    // Toggle to dark
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should toggle from dark to light theme', () => {
    const { result } = renderHook(() => useTheme())
    
    // Start with dark theme
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    
    // Toggle to light
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark')
  })

  it('should respect system preference when theme is system', () => {
    matchMediaMock.matches = true
    
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('system')
    })
    
    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should toggle from system theme to explicit theme', () => {
    matchMediaMock.matches = true
    
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('system')
    })
    
    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    
    // Toggle should switch to light (opposite of resolved dark)
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  it('should persist theme preference to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preference', 'dark')
  })

  it('should apply correct CSS classes to document', () => {
    const { result } = renderHook(() => useTheme())
    
    // Set dark theme
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
    
    // Set light theme
    act(() => {
      result.current.setTheme('light')
    })
    
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark')
  })
})