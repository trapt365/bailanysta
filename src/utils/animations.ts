/**
 * Animation utility functions for consistent micro-interactions
 * Provides helper functions for common animation patterns
 */

// Animation duration constants
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const

// Common animation classes for easy reuse
export const ANIMATION_CLASSES = {
  // Button animations
  BUTTON_HOVER: 'hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5',
  BUTTON_PRESS: 'active:scale-95 transition-transform duration-150',
  BUTTON_LOADING: 'animate-pulse cursor-not-allowed',

  // Form input animations
  INPUT_FOCUS: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200',
  INPUT_ERROR: 'border-red-500 focus:ring-red-500 focus:border-red-500 animate-bounce-subtle',
  INPUT_SUCCESS: 'border-green-500 focus:ring-green-500 focus:border-green-500',

  // Loading animations
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  SLIDE_IN: 'animate-slide-in',
  SLIDE_OUT: 'animate-slide-out',
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',

  // Skeleton animations
  SKELETON_PULSE: 'animate-pulse bg-gray-200 dark:bg-gray-700',
  SKELETON_SHIMMER: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer',

  // Hover effects
  CARD_HOVER: 'hover:shadow-md hover:scale-[1.02] transition-all duration-300',
  LINK_HOVER: 'hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200',
  ICON_HOVER: 'hover:scale-110 transition-transform duration-200',

  // Theme transitions
  THEME_TRANSITION: 'transition-colors duration-300 ease-in-out',
} as const

// Animation variants for different components
export const BUTTON_VARIANTS = {
  primary: `${ANIMATION_CLASSES.BUTTON_HOVER} ${ANIMATION_CLASSES.BUTTON_PRESS}`,
  secondary: `${ANIMATION_CLASSES.BUTTON_HOVER} ${ANIMATION_CLASSES.BUTTON_PRESS}`,
  outline: 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 active:scale-95',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 active:scale-95',
} as const

// Loading state animations
export const LOADING_VARIANTS = {
  spinner: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shimmer: ANIMATION_CLASSES.SKELETON_SHIMMER,
} as const

// Utility functions
export const getLoadingClass = (isLoading: boolean, variant: keyof typeof LOADING_VARIANTS = 'spinner') => {
  return isLoading ? LOADING_VARIANTS[variant] : ''
}

export const getButtonAnimationClass = (variant: keyof typeof BUTTON_VARIANTS = 'primary', isLoading: boolean = false) => {
  if (isLoading) return ANIMATION_CLASSES.BUTTON_LOADING
  return BUTTON_VARIANTS[variant]
}

// Accessibility: Respect user's reduced motion preference
export const REDUCED_MOTION_CLASSES = {
  DISABLE_ANIMATIONS: 'motion-reduce:transition-none motion-reduce:animate-none',
  REDUCE_TRANSFORMS: 'motion-reduce:transform-none',
  REDUCE_HOVER: 'motion-reduce:hover:transform-none',
} as const

// Apply reduced motion classes to animation strings
export const withReducedMotion = (animationClass: string) => {
  return `${animationClass} ${REDUCED_MOTION_CLASSES.DISABLE_ANIMATIONS}`
}

// Animation timing function helpers
export const TIMING_FUNCTIONS = {
  EASE_IN_OUT: 'ease-in-out',
  EASE_OUT: 'ease-out',
  EASE_IN: 'ease-in',
  SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// Performance optimization: Use transform and opacity for better performance
export const PERFORMANT_ANIMATION_PROPS = [
  'transform',
  'opacity',
  'filter',
] as const

// Warning: Avoid these properties for animations as they cause layout recalculations
export const AVOID_ANIMATION_PROPS = [
  'width',
  'height',
  'top',
  'left',
  'margin',
  'padding',
] as const