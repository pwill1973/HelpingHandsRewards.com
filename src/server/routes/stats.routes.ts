import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { createDbClient } from '../db/client'
import { MatrixService } from '../services/matrix.service'
import { users, contributions, rewards, matrixPositions } from '../db/schema'
import type { AuthEnv } from '../middleware/auth'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import type { DashboardStats, AdminStats } from '@shared/types'

const statsRoutes = new Hono<AuthEnv>()

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics for current user
 */
statsRoutes.get('/dashboard', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const db = createDbClient(c.env.DB)
    const matrixService = new MatrixService(db)
    
    // Count personal referrals
    const personalReferralsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredById, user.id))
    const personalReferrals = personalReferralsResult[0]?.count || 0
    
    // Count matrix members
    const matrixMembers = await matrixService.getFilledPositionCount(user.id)
    
    // Count total downline
    const totalDownline = await matrixService.getTotalDownlineCount(user.id)
    
    // Count and sum contributions
    const contributionsResult = await db
      .select({ 
        count: sql<number>`count(*)`,
        sum: sql<number>`COALESCE(sum(${contributions.amount}), 0)`
      })
      .from(contributions)
      .where(eq(contributions.userId, user.id))
    const totalContributions = contributionsResult[0]?.count || 0
    
    // Count and sum rewards
    const rewardsResult = await db
      .select({ 
        count: sql<number>`count(*)`,
        sum: sql<number>`COALESCE(sum(${rewards.amount}), 0)`
      })
      .from(rewards)
      .where(eq(rewards.userId, user.id))
    const totalRewards = rewardsResult[0]?.sum || 0
    
    const stats: DashboardStats = {
      personalReferrals,
      matrixMembers,
      totalDownline,
      totalContributions,
      totalRewards
    }
    
    return c.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/stats/admin
 * Get admin statistics (admin only)
 */
statsRoutes.get('/admin', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = createDbClient(c.env.DB)
    
    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
    const totalUsers = totalUsersResult[0]?.count || 0
    
    // Total contributions
    const totalContributionsResult = await db
      .select({ 
        count: sql<number>`count(*)`,
        sum: sql<number>`COALESCE(sum(${contributions.amount}), 0)`
      })
      .from(contributions)
    const totalContributions = {
      count: totalContributionsResult[0]?.count || 0,
      sum: totalContributionsResult[0]?.sum || 0
    }
    
    // Matrix distribution
    // Count users with 0-1 positions filled (empty)
    const emptyMatricesResult = await db
      .select({ 
        ownerId: matrixPositions.ownerId,
        count: sql<number>`count(${matrixPositions.filledByUserId})`
      })
      .from(matrixPositions)
      .groupBy(matrixPositions.ownerId)
      .having(sql`count(${matrixPositions.filledByUserId}) <= 1`)
    const emptyMatrices = emptyMatricesResult.length
    
    // Count users with 2-3 positions filled (partial)
    const partialMatricesResult = await db
      .select({ 
        ownerId: matrixPositions.ownerId,
        count: sql<number>`count(${matrixPositions.filledByUserId})`
      })
      .from(matrixPositions)
      .groupBy(matrixPositions.ownerId)
      .having(sql`count(${matrixPositions.filledByUserId}) >= 2 AND count(${matrixPositions.filledByUserId}) <= 3`)
    const partialMatrices = partialMatricesResult.length
    
    // Count users with 4-6 positions filled (full)
    const fullMatricesResult = await db
      .select({ 
        ownerId: matrixPositions.ownerId,
        count: sql<number>`count(${matrixPositions.filledByUserId})`
      })
      .from(matrixPositions)
      .groupBy(matrixPositions.ownerId)
      .having(sql`count(${matrixPositions.filledByUserId}) >= 4`)
    const fullMatrices = fullMatricesResult.length
    
    const stats: AdminStats = {
      totalUsers,
      totalContributions,
      matrixDistribution: {
        empty: emptyMatrices,
        partial: partialMatrices,
        full: fullMatrices
      }
    }
    
    return c.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/stats/contributions
 * Get user's contribution history
 */
statsRoutes.get('/contributions', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const db = createDbClient(c.env.DB)
    
    const userContributions = await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, user.id))
      .orderBy(sql`${contributions.createdAt} DESC`)
      .limit(50)
    
    return c.json({
      success: true,
      data: userContributions
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/stats/rewards
 * Get user's reward history
 */
statsRoutes.get('/rewards', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const db = createDbClient(c.env.DB)
    
    const userRewards = await db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, user.id))
      .orderBy(sql`${rewards.createdAt} DESC`)
      .limit(50)
    
    return c.json({
      success: true,
      data: userRewards
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default statsRoutes
