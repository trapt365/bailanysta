import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  
  // Actions
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme) => {
    // Save to localStorage
    localStorage.setItem('theme-preference', theme)
    
    // Update document class for Tailwind dark mode
    const resolvedTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    set({ theme, resolvedTheme })
  },

  initializeTheme: () => {
    // Check localStorage first
    const storedTheme = localStorage.getItem('theme-preference') as Theme | null
    
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      get().setTheme(storedTheme)
    } else {
      // Default to system preference
      get().setTheme('system')
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (get().theme === 'system') {
        const resolvedTheme = mediaQuery.matches ? 'dark' : 'light'
        if (resolvedTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ resolvedTheme })
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  }
}))