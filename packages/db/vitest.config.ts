import { defineConfig } from 'vitest/config'

export default defineConfig({
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
