'use client'

import React from 'react'
import Spinner from './Spinner'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  spinner?: React.ReactNode
  children: React.ReactNode
}

export default function LoadingButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  spinner,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white focus:ring-blue-500 hover:shadow-lg',
    secondary: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:ring-gray-500 hover:shadow-lg',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-blue-500 hover:shadow-md',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-blue-500 hover:shadow-sm'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg'
  }
  
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'sm'
  const spinnerColor = variant === 'outline' || variant === 'ghost' ? 'current' : 'current'
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  
  const defaultSpinner = <Spinner size={spinnerSize} color={spinnerColor} className="mr-2" />
  
  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          {spinner || defaultSpinner}
          {loadingText || 'Loading...'}
        </div>
      ) : (
        children
      )}
    </button>
  )
}