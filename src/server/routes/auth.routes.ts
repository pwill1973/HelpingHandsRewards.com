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
    
    // Find or create user by provider ID (supports automatic merging)
    let user = await authService.findOrCreateUserByProviderId(verifiedUser.userId, {
      email: verifiedUser.email,
      walletAddress: verifiedUser.walletAddress,
      telegramUserId: telegramData?.userId
    })
    
    // If Telegram data is provided and not already linked, link it
    if (telegramData && !user.telegramUserId) {
      // Verify Telegram data signature (basic check)
      // TODO: In production, implement full Telegram signature verification
      // using HMAC-SHA256 with bot token
      
      await authService.linkTelegramUser(user.id, telegramData.userId)
      
      // Refresh user data
      const updatedProfile = await authService.getUserProfile(user.id)
      if (updatedProfile) {
        user = updatedProfile
      }
      
      console.log(`[Auth] Linked Telegram ID to user ${user.id}`)
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
    
    // IDENTITY RESOLUTION PRIORITY:
    // 1. Check if Telegram ID already exists
    // 2. If authToken provided, try to merge with provider account
    // 3. Otherwise, create new Telegram-only account
    
    // Step 1: Check if user already exists with this Telegram ID
    user = await authService.findUserByTelegramId(telegramData.userId)
    
    if (user) {
      // User exists with this Telegram ID
      // If authToken is provided, merge provider ID if missing
      if (authToken && !user.privyUserId) {
        try {
          const { createAuthProviderService } = await import('../services/auth-provider.service')
          const authProviderService = createAuthProviderService(c.env)
          const verifiedUser = await authProviderService.verifyAccessToken(authToken)
          
          // Merge provider ID into existing Telegram account
          await db.update(users)
            .set({ privyUserId: verifiedUser.userId })
            .where(eq(users.id, user.id))
          
          // Refresh user data
          const updatedProfile = await authService.getUserProfile(user.id)
          if (updatedProfile) {
            user = updatedProfile
          }
          
          console.log(`[Auth] Merged provider ID into Telegram user ${user.id}`)
        } catch (error) {
          console.error('Provider ID merge failed (non-critical):', error)
        }
      }
    } else if (authToken) {
      // Step 2: No Telegram user found, but authToken provided
      // Try to link to existing provider account
      try {
        const { createAuthProviderService } = await import('../services/auth-provider.service')
        const authProviderService = createAuthProviderService(c.env)
        const verifiedUser = await authProviderService.verifyAccessToken(authToken)
        
        // Find or create by provider ID (this will merge if wallet/telegram matches)
        user = await authService.findOrCreateUserByProviderId(verifiedUser.userId, {
          email: verifiedUser.email,
          walletAddress: verifiedUser.walletAddress,
          telegramUserId: telegramData.userId
        })
        
        console.log(`[Auth] Linked Telegram to provider account ${user.id}`)
      } catch (error) {
        console.error('Auth provider linking failed:', error)
      }
    }
    
    if (!user) {
      // Step 3: Create new user for pure Telegram-only flow
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
      
      console.log(`[Auth] Created new Telegram-only user ${user.id}`)
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
