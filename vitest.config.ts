import { defineConfig } from 'vitest/config'

// Vitest-specific config. Build config lives in vite.config.ts.
// Coverage gate mirrors the course requirement (≥70% line coverage).
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      thresholds: {
        lines: 70,
      },
    },
  },
})
