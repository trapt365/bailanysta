'use client'

import { useTheme } from '@/hooks/useTheme'
import { SunIcon, MoonIcon } from './icons'

export interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative w-6 h-6">
        <SunIcon 
          className={`absolute inset-0 w-6 h-6 text-gray-700 dark:text-gray-300 transition-all duration-300 ${
            resolvedTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <MoonIcon 
          className={`absolute inset-0 w-6 h-6 text-gray-700 dark:text-gray-300 transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}