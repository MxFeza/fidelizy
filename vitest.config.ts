import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/services/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/services/**/*.ts'],
      exclude: ['lib/services/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
