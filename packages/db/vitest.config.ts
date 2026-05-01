import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    hookTimeout: 30_000,
    testTimeout: 10_000,
    pool: 'forks',
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
  },
})
