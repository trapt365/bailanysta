import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    const baseClassName = `
      w-full px-3 py-2 border rounded-lg shadow-sm text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${error 
        ? 'border-red-300 text-red-900 placeholder-red-300' 
        : 'border-gray-300 text-gray-900 placeholder-gray-400'
      }
      dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
      dark:focus:ring-blue-500 dark:focus:border-blue-500
      ${className || ''}
    `

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          className={baseClassName.trim()}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input