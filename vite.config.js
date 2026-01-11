import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for assets to support deployment on subpaths (e.g. GitHub Pages)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/e2e/**', 'node_modules/**', 'verification/**', 'postcss.config.js', 'tailwind.config.js', 'eslint.config.js', 'vite.config.js'],
    },
  },
})
