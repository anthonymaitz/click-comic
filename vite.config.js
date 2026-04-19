import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { comicsIndexPlugin } from './vite-plugin-comics-index.js'

export default defineConfig({
  plugins: [comicsIndexPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        viewer: fileURLToPath(new URL('./viewer.html', import.meta.url))
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js']
  }
})
