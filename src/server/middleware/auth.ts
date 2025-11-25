import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { AuthService } from '../services/auth.service'
import { createDbClient } from '../db/client'
import { createAuthProviderService } from '../services/auth-provider.service'
import type { UserProfile } from '@shared/types'

export type AuthEnv = {
  Bindings: {
    DB: D1Database
    JWT_SECRET: string
    AUTH_PROVIDER_APP_ID?: string
    AUTH_PROVIDER_APP_SECRET?: string
    PRIVY_APP_ID?: string
    PRIVY_APP_SECRET?: string
    TON_NETWORK?: string
    TON_API_ENDPOINT?: string
  }
  Variables: {
    user: UserProfile
  }
}

/**
 * Authentication middleware
 * Supports both auth provider tokens and legacy JWT
 * Priority: Auth provider token → Legacy JWT
 */
export const authMiddleware = createMiddleware<AuthEnv>(async (c: Context<AuthEnv>, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const db = createDbClient(c.env.DB)
  
  let user: UserProfile | null = null

  // Try auth provider verification first (for new auth flow)
  try {
    const authProviderService = createAuthProviderService(c.env)
    const verifiedUser = await authProviderService.verifyAccessToken(token)
    
    // Find or create user by provider user ID
    const authService = new AuthService(db, c.env.JWT_SECRET)
    user = await authService.findOrCreateUserByProviderId(verifiedUser.userId, {
      email: verifiedUser.email,
      walletAddress: verifiedUser.walletAddress
    })
  } catch (providerError) {
    // If provider verification fails, try legacy JWT
    try {
      const authService = new AuthService(db, c.env.JWT_SECRET)
      user = await authService.verifyToken(token)
    } catch (jwtError) {
      // Both methods failed
      console.error('Auth verification failed:', { providerError, jwtError })
    }
  }
  
  if (!user) {
    return c.json({ success: false, error: 'Invalid authentication' }, 401)
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
