import { eq, and, isNull, sql, desc } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { 
  matrixInstances, 
  matrixPositions, 
  matrixLevels,
  userLevelActivations,
  users,
  rewards,
  contributions
} from '../db/schema'

/**
 * Matrix Service - Complete 2×2 Community Matrix Implementation
 * 
 * Features:
 * - 10 Contribution Levels (5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560)
 * - Equal Distribution Placement (1→2→3→4→5→6)
 * - Position 3 & 4: Direct Recurring Rewards
 * - Position 5: Auto-Upgrade
 * - Position 6: Re-entry
 */
export class MatrixService {
  constructor(private db: DbClient) {}

  /**
   * Initialize matrix instances for user at specified levels
   */
  async initializeUserMatrices(userId: number, levelIds: number[]): Promise<void> {
    for (const levelId of levelIds) {
      await this.createMatrixInstance(userId, levelId, 1)
      await this.activateLevel(userId, levelId)
    }
  }

  /**
   * Create a new matrix instance with 6 empty positions
   */
  async createMatrixInstance(userId: number, levelId: number, cycleNumber: number): Promise<number> {
    // Create matrix instance
    const [instance] = await this.db.insert(matrixInstances).values({
      userId,
      levelId,
      cycleNumber,
      status: 'OPEN'
    }).returning()

    // Create 6 empty positions
    const positions = [1, 2, 3, 4, 5, 6].map(slotNumber => ({
      matrixInstanceId: instance.id,
      slotNumber,
      filledByUserId: null
    }))

    await this.db.insert(matrixPositions).values(positions)

    return instance.id
  }

  /**
   * Activate a level for a user
   */
  async activateLevel(userId: number, levelId: number): Promise<void> {
    // Check if already activated
    const existing = await this.db.query.userLevelActivations.findFirst({
      where: and(
        eq(userLevelActivations.userId, userId),
        eq(userLevelActivations.levelId, levelId)
      )
    })

    if (!existing) {
      await this.db.insert(userLevelActivations).values({
        userId,
        levelId,
        isActive: true
      })
    }
  }

  /**
   * Check if user has activated a level
   */
  async isLevelActivated(userId: number, levelId: number): Promise<boolean> {
    const activation = await this.db.query.userLevelActivations.findFirst({
      where: and(
        eq(userLevelActivations.userId, userId),
        eq(userLevelActivations.levelId, levelId),
        eq(userLevelActivations.isActive, true)
      )
    })

    return !!activation
  }

  /**
   * Place new member in sponsor's matrix at specified level
   * Implements EXACT placement order: 1→2→3→4→5→6
   */
  async placeNewMember(
    sponsorId: number, 
    newUserId: number, 
    levelId: number
  ): Promise<void> {
    // Find sponsor's active matrix instance for this level
    let targetMatrixId = await this.findAvailableMatrixForPlacement(sponsorId, levelId)

    if (!targetMatrixId) {
      // Sponsor's matrix is full, use spillover (BFS)
      targetMatrixId = await this.findSpilloverMatrix(sponsorId, levelId)
    }

    if (!targetMatrixId) {
      throw new Error('No available matrix position found')
    }

    // Find next available slot in exact order (1→2→3→4→5→6)
    const availablePosition = await this.db.query.matrixPositions.findFirst({
      where: and(
        eq(matrixPositions.matrixInstanceId, targetMatrixId),
        isNull(matrixPositions.filledByUserId)
      ),
      orderBy: [matrixPositions.slotNumber] // Ensures 1→2→3→4→5→6 order
    })

    if (!availablePosition) {
      throw new Error('No available position in matrix')
    }

    // Fill the position
    await this.db.update(matrixPositions)
      .set({ 
        filledByUserId: newUserId,
        filledAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(matrixPositions.id, availablePosition.id))

    // Get matrix instance details
    const matrixInstance = await this.db.query.matrixInstances.findFirst({
      where: eq(matrixInstances.id, targetMatrixId)
    })

    if (!matrixInstance) return

    // Handle reward distribution based on slot number
    await this.handlePositionFilled(
      matrixInstance.userId,
      newUserId,
      levelId,
      availablePosition.slotNumber,
      targetMatrixId
    )

    // Check if matrix is now full
    await this.checkAndMarkMatrixFilled(targetMatrixId)
  }

  /**
   * Handle reward distribution when a position is filled
   */
  private async handlePositionFilled(
    matrixOwnerId: number,
    newMemberId: number,
    levelId: number,
    slotNumber: number,
    matrixInstanceId: number
  ): Promise<void> {
    const level = await this.db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.id, levelId)
    })

    if (!level) return

    const amount = level.amount

    switch (slotNumber) {
      case 3:
      case 4:
        // DIRECT RECURRING REWARD (100% to matrix owner)
        await this.grantDirectReward(matrixOwnerId, newMemberId, levelId, amount, matrixInstanceId)
        break

      case 5:
        // AUTO-UPGRADE LOGIC
        await this.handleAutoUpgrade(matrixOwnerId, levelId, amount, newMemberId, matrixInstanceId)
        break

      case 6:
        // RE-ENTRY LOGIC
        await this.handleReentry(matrixOwnerId, levelId, amount, matrixInstanceId)
        break

      default:
        // Positions 1 and 2 - no direct rewards, just structural
        break
    }
  }

  /**
   * Grant Direct Recurring Reward (Positions 3 & 4)
   */
  private async grantDirectReward(
    recipientId: number,
    fromUserId: number,
    levelId: number,
    amount: number,
    matrixInstanceId: number
  ): Promise<void> {
    await this.db.insert(rewards).values({
      userId: recipientId,
      levelId,
      type: 'DIRECT',
      amount,
      currency: 'USDT-TON',
      description: `Direct Recurring Reward from community member ${fromUserId}`,
      fromUserId,
      matrixInstanceId
    })
  }

  /**
   * Handle Auto-Upgrade (Position 5)
   */
  private async handleAutoUpgrade(
    userId: number,
    currentLevelId: number,
    amount: number,
    fromUserId: number,
    matrixInstanceId: number
  ): Promise<void> {
    // Get current level info
    const currentLevel = await this.db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.id, currentLevelId)
    })

    if (!currentLevel) return

    // Find next level
    const nextLevel = await this.db.query.matrixLevels.findFirst({
      where: eq(matrixLevels.level, currentLevel.level + 1)
    })

    if (!nextLevel) {
      // No next level exists, treat as regular reward
      await this.grantDirectReward(userId, fromUserId, currentLevelId, amount, matrixInstanceId)
      return
    }

    // Check if user already has next level activated
    const isActivated = await this.isLevelActivated(userId, nextLevel.id)

    if (isActivated) {
      // Already has next level, grant as regular reward
      await this.grantDirectReward(userId, fromUserId, currentLevelId, amount, matrixInstanceId)
    } else {
      // AUTO-UPGRADE: Activate next level
      await this.activateLevel(userId, nextLevel.id)
      await this.createMatrixInstance(userId, nextLevel.id, 1)

      // Log upgrade reward
      await this.db.insert(rewards).values({
        userId,
        levelId: nextLevel.id,
        type: 'UPGRADE',
        amount,
        currency: 'USDT-TON',
        description: `Auto-upgrade to Level ${nextLevel.level} (${nextLevel.amount} USDT-TON)`,
        fromUserId,
        matrixInstanceId
      })
    }
  }

  /**
   * Handle Re-entry (Position 6)
   */
  private async handleReentry(
    userId: number,
    levelId: number,
    amount: number,
    completedMatrixInstanceId: number
  ): Promise<void> {
    // Get user's sponsor
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user || !user.referredById) {
      // No sponsor, can't re-enter - treat as reward
      await this.db.insert(rewards).values({
        userId,
        levelId,
        type: 'REENTRY',
        amount,
        currency: 'USDT-TON',
        description: 'Re-entry reward (no sponsor)',
        matrixInstanceId: completedMatrixInstanceId
      })
      return
    }

    // Get current cycle number
    const completedMatrix = await this.db.query.matrixInstances.findFirst({
      where: eq(matrixInstances.id, completedMatrixInstanceId)
    })

    const nextCycle = (completedMatrix?.cycleNumber || 1) + 1

    // Create new matrix instance for re-entry
    const newMatrixId = await this.createMatrixInstance(userId, levelId, nextCycle)

    // Place user back in sponsor's matrix
    await this.placeNewMember(user.referredById, userId, levelId)

    // Log re-entry reward
    await this.db.insert(rewards).values({
      userId,
      levelId,
      type: 'REENTRY',
      amount,
      currency: 'USDT-TON',
      description: `Re-entry to Cycle ${nextCycle}`,
      matrixInstanceId: newMatrixId
    })
  }

  /**
   * Find available matrix for placement (BFS for spillover)
   */
  private async findAvailableMatrixForPlacement(
    userId: number,
    levelId: number
  ): Promise<number | null> {
    // Get user's most recent OPEN matrix for this level
    const openMatrix = await this.db.query.matrixInstances.findFirst({
      where: and(
        eq(matrixInstances.userId, userId),
        eq(matrixInstances.levelId, levelId),
        eq(matrixInstances.status, 'OPEN')
      ),
      orderBy: [desc(matrixInstances.createdAt)]
    })

    if (!openMatrix) return null

    // Check if this matrix has available positions
    const availablePos = await this.db.query.matrixPositions.findFirst({
      where: and(
        eq(matrixPositions.matrixInstanceId, openMatrix.id),
        isNull(matrixPositions.filledByUserId)
      )
    })

    return availablePos ? openMatrix.id : null
  }

  /**
   * Find spillover matrix using BFS
   */
  private async findSpilloverMatrix(
    sponsorId: number,
    levelId: number
  ): Promise<number | null> {
    const queue: number[] = [sponsorId]
    const visited = new Set<number>()
    let iterations = 0
    const maxIterations = 1000 // Prevent infinite loops

    while (queue.length > 0 && iterations < maxIterations) {
      iterations++
      const currentUserId = queue.shift()!

      if (visited.has(currentUserId)) continue
      visited.add(currentUserId)

      // Check for available matrix
      const matrixId = await this.findAvailableMatrixForPlacement(currentUserId, levelId)
      if (matrixId) return matrixId

      // Add downline members to queue
      const downlineMatrices = await this.db.query.matrixInstances.findMany({
        where: and(
          eq(matrixInstances.userId, currentUserId),
          eq(matrixInstances.levelId, levelId)
        )
      })

      for (const matrix of downlineMatrices) {
        const filledPositions = await this.db.query.matrixPositions.findMany({
          where: and(
            eq(matrixPositions.matrixInstanceId, matrix.id),
            sql`${matrixPositions.filledByUserId} IS NOT NULL`
          )
        })

        for (const pos of filledPositions) {
          if (pos.filledByUserId && !visited.has(pos.filledByUserId)) {
            queue.push(pos.filledByUserId)
          }
        }
      }
    }

    return null
  }

  /**
   * Check and mark matrix as FILLED if all 6 positions are occupied
   */
  private async checkAndMarkMatrixFilled(matrixInstanceId: number): Promise<void> {
    const filledCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(matrixPositions)
      .where(and(
        eq(matrixPositions.matrixInstanceId, matrixInstanceId),
        sql`${matrixPositions.filledByUserId} IS NOT NULL`
      ))

    if (filledCount[0]?.count === 6) {
      await this.db.update(matrixInstances)
        .set({ 
          status: 'FILLED',
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(matrixInstances.id, matrixInstanceId))
    }
  }

  /**
   * Get user's matrix view for a specific level
   */
  async getUserMatrixForLevel(userId: number, levelId: number) {
    // Get most recent matrix instance
    const instance = await this.db.query.matrixInstances.findFirst({
      where: and(
        eq(matrixInstances.userId, userId),
        eq(matrixInstances.levelId, levelId)
      ),
      orderBy: [desc(matrixInstances.createdAt)]
    })

    if (!instance) return null

    // Get all positions
    const positions = await this.db.query.matrixPositions.findMany({
      where: eq(matrixPositions.matrixInstanceId, instance.id),
      orderBy: [matrixPositions.slotNumber]
    })

    // Enrich with user data
    const enrichedPositions = await Promise.all(
      positions.map(async (pos) => {
        let filledByUser = null
        if (pos.filledByUserId) {
          const user = await this.db.query.users.findFirst({
            where: eq(users.id, pos.filledByUserId),
            columns: { id: true, fullName: true, memberCode: true, username: true }
          })
          filledByUser = user || null
        }
        return { ...pos, filledByUser }
      })
    )

    return {
      instance,
      positions: enrichedPositions
    }
  }

  /**
   * Get all activated levels for a user
   */
  async getUserActivatedLevels(userId: number) {
    const activations = await this.db.query.userLevelActivations.findMany({
      where: and(
        eq(userLevelActivations.userId, userId),
        eq(userLevelActivations.isActive, true)
      )
    })

    const levels = await Promise.all(
      activations.map(async (activation) => {
        return await this.db.query.matrixLevels.findFirst({
          where: eq(matrixLevels.id, activation.levelId)
        })
      })
    )

    return levels.filter(Boolean)
  }
}
