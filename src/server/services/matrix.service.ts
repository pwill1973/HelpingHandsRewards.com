import { eq, and, isNull, sql } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { matrixPositions, users } from '../db/schema'
import type { MatrixView, MatrixPositionData } from '@shared/types'

/**
 * Matrix Service
 * Handles 2×2 Community Matrix placement logic
 * 
 * Matrix Structure:
 * - Level 1: 2 positions (index 1, 2)
 * - Level 2: 4 positions (index 3, 4, 5, 6)
 * Total: 6 positions per user
 */
export class MatrixService {
  constructor(private db: DbClient) {}

  /**
   * Place a new member in the sponsor's matrix
   * Implements breadth-first spillover placement
   */
  async placeNewMember(sponsorId: number, newUserId: number): Promise<void> {
    // Find available position in sponsor's matrix
    let availablePosition = await this.findAvailablePosition(sponsorId)

    if (!availablePosition) {
      // Sponsor's matrix is full, find spillover position
      availablePosition = await this.findSpilloverPosition(sponsorId)
    }

    if (!availablePosition) {
      throw new Error('No available position found in matrix')
    }

    // Fill the position
    await this.db.update(matrixPositions)
      .set({ 
        filledByUserId: newUserId,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(matrixPositions.id, availablePosition.id))

    // Initialize matrix for new user
    await this.initializeMatrix(newUserId)

    // Grant referral reward to sponsor
    await this.grantReferralReward(sponsorId, newUserId)
  }

  /**
   * Initialize a 2×2 matrix for a new user
   * Creates 6 empty positions
   */
  async initializeMatrix(userId: number): Promise<void> {
    // Level 1: positions 1-2
    const [pos1] = await this.db.insert(matrixPositions).values({
      ownerId: userId,
      positionIndex: 1,
      level: 1,
      filledByUserId: null
    }).returning()

    const [pos2] = await this.db.insert(matrixPositions).values({
      ownerId: userId,
      positionIndex: 2,
      level: 1,
      filledByUserId: null
    }).returning()

    // Level 2: positions 3-6 (under Level 1)
    await this.db.insert(matrixPositions).values([
      {
        ownerId: userId,
        positionIndex: 3,
        level: 2,
        parentPositionId: pos1.id,
        filledByUserId: null
      },
      {
        ownerId: userId,
        positionIndex: 4,
        level: 2,
        parentPositionId: pos1.id,
        filledByUserId: null
      },
      {
        ownerId: userId,
        positionIndex: 5,
        level: 2,
        parentPositionId: pos2.id,
        filledByUserId: null
      },
      {
        ownerId: userId,
        positionIndex: 6,
        level: 2,
        parentPositionId: pos2.id,
        filledByUserId: null
      }
    ])
  }

  /**
   * Get matrix view for a user
   */
  async getMatrixView(userId: number): Promise<MatrixView> {
    const owner = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, fullName: true, memberCode: true }
    })

    if (!owner) {
      throw new Error('User not found')
    }

    // Get all positions for this user
    const positions = await this.db.query.matrixPositions.findMany({
      where: eq(matrixPositions.ownerId, userId)
    })

    // Enrich positions with user data
    const enrichedPositions: MatrixPositionData[] = []
    
    for (const pos of positions) {
      let filledByUser = null
      
      if (pos.filledByUserId) {
        const user = await this.db.query.users.findFirst({
          where: eq(users.id, pos.filledByUserId),
          columns: { id: true, fullName: true, memberCode: true, username: true }
        })
        filledByUser = user || null
      }

      enrichedPositions.push({
        id: pos.id,
        ownerId: pos.ownerId,
        positionIndex: pos.positionIndex,
        filledByUserId: pos.filledByUserId,
        parentPositionId: pos.parentPositionId,
        level: pos.level,
        filledByUser
      })
    }

    // Sort by position index
    enrichedPositions.sort((a, b) => a.positionIndex - b.positionIndex)

    const level1 = enrichedPositions.filter(p => p.level === 1)
    const level2 = enrichedPositions.filter(p => p.level === 2)

    return {
      owner,
      positions: enrichedPositions,
      level1,
      level2
    }
  }

  /**
   * Get count of filled positions in user's matrix
   */
  async getFilledPositionCount(userId: number): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(matrixPositions)
      .where(
        and(
          eq(matrixPositions.ownerId, userId),
          sql`${matrixPositions.filledByUserId} IS NOT NULL`
        )
      )

    return result[0]?.count || 0
  }

  /**
   * Get total downline count (all users in the tree below this user)
   */
  async getTotalDownlineCount(userId: number): Promise<number> {
    // Recursive query to count all downline members
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredById, userId))

    return result[0]?.count || 0
  }

  /**
   * Find available position in user's matrix
   */
  private async findAvailablePosition(userId: number) {
    return await this.db.query.matrixPositions.findFirst({
      where: and(
        eq(matrixPositions.ownerId, userId),
        isNull(matrixPositions.filledByUserId)
      ),
      orderBy: (positions, { asc }) => [asc(positions.positionIndex)]
    })
  }

  /**
   * Find spillover position using breadth-first search
   */
  private async findSpilloverPosition(sponsorId: number) {
    const queue: number[] = [sponsorId]
    const visited = new Set<number>()

    while (queue.length > 0) {
      const currentUserId = queue.shift()!
      
      if (visited.has(currentUserId)) continue
      visited.add(currentUserId)

      // Check for available position
      const availablePos = await this.findAvailablePosition(currentUserId)
      if (availablePos) {
        return availablePos
      }

      // Add filled positions to queue for BFS
      const filledPositions = await this.db.query.matrixPositions.findMany({
        where: and(
          eq(matrixPositions.ownerId, currentUserId),
          sql`${matrixPositions.filledByUserId} IS NOT NULL`
        )
      })

      for (const pos of filledPositions) {
        if (pos.filledByUserId && !visited.has(pos.filledByUserId)) {
          queue.push(pos.filledByUserId)
        }
      }
    }

    return undefined
  }

  /**
   * Grant referral reward to sponsor
   * This is a placeholder - actual rewards will be handled by smart contract
   */
  private async grantReferralReward(sponsorId: number, newUserId: number): Promise<void> {
    // TODO: In production, this would interact with TON smart contract
    // For now, we just create a reward record
    const { rewards } = await import('../db/schema')
    
    await this.db.insert(rewards).values({
      userId: sponsorId,
      type: 'REFERRAL',
      amount: 0.1, // Placeholder amount
      currency: 'TON',
      description: `Referral reward for inviting member ${newUserId}`
    })
  }
}
