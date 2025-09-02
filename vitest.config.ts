import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/setup.ts',
        '.next/',
        'out/',
        'public/',
        '**/*.d.ts',
        '**/types.ts',
        'docs/',
        'scripts/',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Test timeouts for different test types
    testTimeout: 10000, // 10 seconds default
    hookTimeout: 10000, // 10 seconds for setup/teardown
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})