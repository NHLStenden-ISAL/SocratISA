import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
        'src/App.tsx',
        'src/routes.tsx',
        'src/i18n.ts',
        'src/**/*.d.ts',
        'src/types/i18n-keys.ts',
        'src/__tests__/',
      ],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 65,
      },
    },
  },
})
