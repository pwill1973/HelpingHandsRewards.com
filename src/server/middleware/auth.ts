import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { AuthService } from '../services/auth.service'
import { createDbClient } from '../db/client'
import type { UserProfile } from '@shared/types'

export type AuthEnv = {
  Bindings: {
    DB: D1Database
    JWT_SECRET: string
    TON_NETWORK?: string
    TON_API_ENDPOINT?: string
  }
  Variables: {
    user: UserProfile
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to context
 */
export const authMiddleware = createMiddleware<AuthEnv>(async (c: Context<AuthEnv>, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  
  const db = createDbClient(c.env.DB)
  const authService = new AuthService(db, c.env.JWT_SECRET)
  
  const user = await authService.verifyToken(token)
  
  if (!user) {
    return c.json({ success: false, error: 'Invalid token' }, 401)
  }

  c.set('user', user)
  await next()
})

/**
 * Admin middleware
 * Requires authentication and admin privileges
 */
export const adminMiddleware = createMiddleware<AuthEnv>(async (c: Context<AuthEnv>, next) => {
  const user = c.get('user')
  
  if (!user?.isAdmin) {
    return c.json({ success: false, error: 'Admin access required' }, 403)
  }

  await next()
})
