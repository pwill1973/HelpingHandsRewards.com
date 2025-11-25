import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createDbClient } from '../db/client'
import { AuthService } from '../services/auth.service'
import { MatrixService } from '../services/matrix.service'
import { users } from '../db/schema'
import type { AuthEnv } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'

const authRoutes = new Hono<AuthEnv>()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  country: z.string().optional(),
  referralCode: z.string().optional(),
  selectedLevels: z.array(z.number()).min(1).max(10) // Must select at least 1 level, max 10
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

/**
 * POST /api/auth/register
 * Register a new user
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    
    const db = createDbClient(c.env.DB)
    const authService = new AuthService(db, c.env.JWT_SECRET)
    const matrixService = new MatrixService(db)
    
    // Register user
    const user = await authService.register(data)
    
    // Initialize matrices for selected levels
    await matrixService.initializeUserMatrices(user.id, data.selectedLevels)
    
    // Place user in sponsor's matrices if referred
    if (user.referredById) {
      // Place in each activated level
      for (const levelId of data.selectedLevels) {
        await matrixService.placeNewMember(user.referredById, user.id, levelId)
      }
    }
    
    // Generate token
    const token = await authService.login(data.email, data.password)
    
    return c.json({
      success: true,
      data: {
        user,
        token: token.token
      },
      message: 'Registration successful'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Registration failed'
    }, 400)
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    
    const db = createDbClient(c.env.DB)
    const authService = new AuthService(db, c.env.JWT_SECRET)
    
    const result = await authService.login(email, password)
    
    return c.json({
      success: true,
      data: result,
      message: 'Login successful'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Login failed'
    }, 401)
  }
})

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
authRoutes.post('/logout', authMiddleware, async (c) => {
  return c.json({
    success: true,
    message: 'Logout successful'
  })
})

/**
 * GET /api/auth/me
 * Get current user profile
 */
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    const db = createDbClient(c.env.DB)
    const authService = new AuthService(db, c.env.JWT_SECRET)
    
    const profile = await authService.getUserProfile(user.id)
    
    return c.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/auth/verify-session
 * Verify auth provider session and return/create user
 */
const verifySessionSchema = z.object({
  authToken: z.string(),
  telegramData: z.object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    username: z.string().optional(),
    photoUrl: z.string().optional(),
    authDate: z.number(),
    hash: z.string()
  }).optional()
})

authRoutes.post('/verify-session', zValidator('json', verifySessionSchema), async (c) => {
  try {
    const { authToken, telegramData } = c.req.valid('json')
    
    const db = createDbClient(c.env.DB)
    const authService = new AuthService(db, c.env.JWT_SECRET)
    
    // Import auth provider service
    const { createAuthProviderService } = await import('../services/auth-provider.service')
    const authProviderService = createAuthProviderService(c.env)
    
    // Verify the auth provider token
    const verifiedUser = await authProviderService.verifyAccessToken(authToken)
    
    // Find or create user by provider ID
    let user = await authService.findOrCreateUserByProviderId(verifiedUser.userId, {
      email: verifiedUser.email,
      walletAddress: verifiedUser.walletAddress
    })
    
    // If Telegram data is provided, link it
    if (telegramData) {
      // Verify Telegram data signature (basic check)
      // In production, implement full Telegram signature verification
      await authService.linkTelegramUser(user.id, telegramData.userId)
      
      // Refresh user data
      const updatedProfile = await authService.getUserProfile(user.id)
      if (updatedProfile) {
        user = updatedProfile
      }
    }
    
    // Generate our own JWT for subsequent requests
    const token = await authService['generateToken'](user.id)
    
    return c.json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Session verified'
    })
  } catch (error: any) {
    console.error('Session verification error:', error)
    return c.json({
      success: false,
      error: error.message || 'Session verification failed'
    }, 401)
  }
})

/**
 * POST /api/auth/telegram-init
 * Initialize Telegram mini-app user
 */
const telegramInitSchema = z.object({
  telegramData: z.object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    username: z.string().optional(),
    photoUrl: z.string().optional(),
    authDate: z.number(),
    hash: z.string()
  }),
  authToken: z.string().optional()
})

authRoutes.post('/telegram-init', zValidator('json', telegramInitSchema), async (c) => {
  try {
    const { telegramData, authToken } = c.req.valid('json')
    
    const db = createDbClient(c.env.DB)
    const authService = new AuthService(db, c.env.JWT_SECRET)
    
    let user: any = null
    
    // Check if user already exists with this Telegram ID
    user = await authService.findUserByTelegramId(telegramData.userId)
    
    if (!user && authToken) {
      // Try to link to existing auth provider account
      try {
        const { createAuthProviderService } = await import('../services/auth-provider.service')
        const authProviderService = createAuthProviderService(c.env)
        const verifiedUser = await authProviderService.verifyAccessToken(authToken)
        
        // Find or create by provider ID
        user = await authService.findOrCreateUserByProviderId(verifiedUser.userId, {
          email: verifiedUser.email,
          walletAddress: verifiedUser.walletAddress
        })
        
        // Link Telegram ID
        await authService.linkTelegramUser(user.id, telegramData.userId)
      } catch (error) {
        console.error('Auth provider linking failed:', error)
      }
    }
    
    if (!user) {
      // Create new user for Telegram-only flow
      const username = telegramData.username || `tg_${telegramData.userId}`
      const memberCode = await authService['generateUniqueMemberCode']()
      const referralCode = await authService['generateUniqueReferralCode']()
      
      const result: any = await db.insert(users).values({
        telegramUserId: telegramData.userId,
        fullName: `${telegramData.firstName} ${telegramData.lastName || ''}`.trim(),
        username,
        memberCode,
        referralCode,
        isAdmin: false
      }).returning()
      
      user = authService['toUserProfile'](result[0])
    }
    
    // Generate JWT
    const token = await authService['generateToken'](user.id)
    
    return c.json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Telegram user initialized'
    })
  } catch (error: any) {
    console.error('Telegram init error:', error)
    return c.json({
      success: false,
      error: error.message || 'Telegram initialization failed'
    }, 400)
  }
})

export default authRoutes
