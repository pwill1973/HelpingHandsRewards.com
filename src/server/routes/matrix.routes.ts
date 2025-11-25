import { Hono } from 'hono'
import { createDbClient } from '../db/client'
import { MatrixService } from '../services/matrix.service'
import type { AuthEnv } from '../middleware/auth'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

const matrixRoutes = new Hono<AuthEnv>()

/**
 * GET /api/matrix
 * Get current user's matrix view
 */
matrixRoutes.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    const matrixView = await matrixService.getMatrixView(user.id)
    
    return c.json({
      success: true,
      data: matrixView
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/matrix/:userId
 * Get specific user's matrix view (admin only)
 */
matrixRoutes.get('/:userId', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'Invalid user ID'
      }, 400)
    }
    
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    const matrixView = await matrixService.getMatrixView(userId)
    
    return c.json({
      success: true,
      data: matrixView
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default matrixRoutes
