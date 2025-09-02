'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function ThemeInitializer() {
  const { initializeTheme } = useUIStore()

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  return null
}