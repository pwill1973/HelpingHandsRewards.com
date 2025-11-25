import { defineConfig } from 'vite'
import cloudflarePages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [
    cloudflarePages({
      entry: 'src/server/index.tsx'
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@server': '/src/server',
      '@client': '/src/client',
      '@shared': '/src/shared'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false  // Don't delete client assets
  }
})
