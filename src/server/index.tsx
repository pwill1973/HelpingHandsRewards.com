import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth.routes'
import matrixRoutes from './routes/matrix.routes'
import tonRoutes from './routes/ton.routes'
import statsRoutes from './routes/stats.routes'
import type { AuthEnv } from './middleware/auth'

const app = new Hono<AuthEnv>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  credentials: true
}))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/matrix', matrixRoutes)
app.route('/api/ton', tonRoutes)
app.route('/api/stats', statsRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    message: '2×2 Community Matrix API is running',
    timestamp: new Date().toISOString()
  })
})

// SPA fallback - serve index.html for all non-API routes
// Static assets (/assets/*) are automatically served by Cloudflare Pages
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="2×2 Community Matrix on TON - A decentralized community support system built on the TON blockchain" />
    <title>2×2 Community Matrix on TON</title>
    <script type="module" crossorigin src="/assets/index-DB_3NJbd.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Bijditlr.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`)
})

export default app
