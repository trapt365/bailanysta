import { useEffect } from 'react'
import { useUIStore, type Theme } from '@/stores/uiStore'

export interface UseThemeReturn {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useTheme = (): UseThemeReturn => {
  const { theme, resolvedTheme, setTheme, initializeTheme } = useUIStore()

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  }
}