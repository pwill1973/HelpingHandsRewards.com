import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDbClient } from '../db/client'
import { MatrixService } from '../services/matrix.service'
import { matrixLevels } from '../db/schema'
import type { AuthEnv } from '../middleware/auth'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const matrixRoutes = new Hono<AuthEnv>()

/**
 * GET /api/matrix/levels
 * Get all matrix levels
 */
matrixRoutes.get('/levels', async (c) => {
  try {
    const db = createDbClient(c.env.DB)
    
    const levels = await db.query.matrixLevels.findMany({
      orderBy: (levels, { asc }) => [asc(levels.level)]
    })
    
    return c.json({
      success: true,
      data: levels
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/matrix/user-levels
 * Get user's activated levels
 */
matrixRoutes.get('/user-levels', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    const activatedLevels = await matrixService.getUserActivatedLevels(user.id)
    
    return c.json({
      success: true,
      data: activatedLevels
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/matrix/:levelId
 * Get current user's matrix view for specific level
 */
matrixRoutes.get('/:levelId', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const levelId = parseInt(c.req.param('levelId'))
    
    if (isNaN(levelId)) {
      return c.json({
        success: false,
        error: 'Invalid level ID'
      }, 400)
    }
    
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    // Get level info
    const level = await db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.id, levelId)
    })

    if (!level) {
      return c.json({
        success: false,
        error: 'Level not found'
      }, 404)
    }
    
    // Get matrix
    const matrixData = await matrixService.getUserMatrixForLevel(user.id, levelId)
    
    if (!matrixData) {
      return c.json({
        success: false,
        error: 'Matrix not found for this level'
      }, 404)
    }

    const userInfo = await db.query.users.findFirst({
      where: eq(db.query.users.id, user.id),
      columns: { id: true, fullName: true, memberCode: true }
    })
    
    return c.json({
      success: true,
      data: {
        level,
        instance: matrixData.instance,
        positions: matrixData.positions,
        owner: userInfo
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/matrix/activate-levels
 * Activate multiple contribution levels for authenticated user
 * 
 * WALLET-FIRST: User is identified by ton_wallet_address (via userId)
 * This creates matrix instances for each selected level
 */
matrixRoutes.post('/activate-levels', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    
    if (!body.levels || !Array.isArray(body.levels) || body.levels.length === 0) {
      return c.json({
        success: false,
        error: 'No levels provided'
      }, 400)
    }
    
    const levels: number[] = body.levels
    
    // Validate all levels are numbers between 1-10
    for (const level of levels) {
      if (!Number.isInteger(level) || level < 1 || level > 10) {
        return c.json({
          success: false,
          error: `Invalid level: ${level}. Must be between 1 and 10.`
        }, 400)
      }
    }
    
    // Validate sequential activation rule
    const sortedLevels = [...levels].sort((a, b) => a - b)
    for (let i = 0; i < sortedLevels.length; i++) {
      const expectedLevel = i + 1
      if (sortedLevels[i] !== expectedLevel) {
        return c.json({
          success: false,
          error: `Levels must be activated sequentially starting from Level 1. Missing Level ${expectedLevel}.`
        }, 400)
      }
    }
    
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    // Get corresponding level IDs from level numbers
    const levelRecords = await db.query.matrixLevels.findMany({
      orderBy: (levels, { asc }) => [asc(levels.level)]
    })
    
    const levelIdMap = new Map(levelRecords.map(l => [l.level, l.id]))
    const levelIdsToActivate = levels.map(levelNum => levelIdMap.get(levelNum)).filter(Boolean) as number[]
    
    if (levelIdsToActivate.length !== levels.length) {
      return c.json({
        success: false,
        error: 'Some levels not found in system'
      }, 500)
    }
    
    // Initialize matrices for all selected levels
    await matrixService.initializeUserMatrices(user.id, levelIdsToActivate)
    
    // Get updated activated levels
    const activatedLevels = await matrixService.getUserActivatedLevels(user.id)
    
    return c.json({
      success: true,
      data: {
        activatedLevels,
        message: `Successfully activated ${levels.length} Contribution Level${levels.length > 1 ? 's' : ''}`
      }
    })
  } catch (error: any) {
    console.error('Level activation error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to activate levels'
    }, 500)
  }
})

/**
 * GET /api/matrix/user/:userId/level/:levelId
 * Get specific user's matrix view (admin only)
 */
matrixRoutes.get('/user/:userId/level/:levelId', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const levelId = parseInt(c.req.param('levelId'))
    
    if (isNaN(userId) || isNaN(levelId)) {
      return c.json({
        success: false,
        error: 'Invalid user ID or level ID'
      }, 400)
    }
    
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    const level = await db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.id, levelId)
    })

    if (!level) {
      return c.json({
        success: false,
        error: 'Level not found'
      }, 404)
    }
    
    const matrixData = await matrixService.getUserMatrixForLevel(userId, levelId)
    
    if (!matrixData) {
      return c.json({
        success: false,
        error: 'Matrix not found'
      }, 404)
    }

    const userInfo = await db.query.users.findFirst({
      where: eq(db.query.users.id, userId),
      columns: { id: true, fullName: true, memberCode: true }
    })
    
    return c.json({
      success: true,
      data: {
        level,
        instance: matrixData.instance,
        positions: matrixData.positions,
        owner: userInfo
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default matrixRoutes
