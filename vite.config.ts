import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    react(),
    pages(),
    devServer({
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
    rollupOptions: {
      input: './src/client/main.tsx'
    }
  }
})
