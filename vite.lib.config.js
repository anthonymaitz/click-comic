import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/lib/ClickComic.js', import.meta.url)),
      name: 'ClickComic',
      fileName: 'click-comic',
      formats: ['es']
    },
    outDir: 'dist/lib',
    emptyOutDir: false
  }
})
