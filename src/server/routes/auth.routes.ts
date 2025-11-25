import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createDbClient } from '../db/client'
import { AuthService } from '../services/auth.service'
import { MatrixService } from '../services/matrix.service'
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
 * GET /api/me
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

export default authRoutes
