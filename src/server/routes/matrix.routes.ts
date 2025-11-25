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
