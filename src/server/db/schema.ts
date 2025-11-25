import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Users table - stores all user accounts
 */
export const users: any = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  memberCode: text('member_code').notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  country: text('country'),
  
  // TON Integration
  tonWalletAddress: text('ton_wallet_address'),
  tonNetwork: text('ton_network', { enum: ['testnet', 'mainnet'] }).default('testnet'),
  
  // Referral relationship
  referredById: integer('referred_by_id').references(() => users.id),
  
  // Admin flag
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Matrix Positions - represents the 2×2 matrix structure
 * Each user has 6 positions: 2 on Level 1, 4 on Level 2
 */
export const matrixPositions = sqliteTable('matrix_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // The user who owns this matrix position
  ownerId: integer('owner_id').notNull().references(() => users.id),
  
  // Position index: 1-6 (1-2 for Level 1, 3-6 for Level 2)
  positionIndex: integer('position_index').notNull(),
  
  // The user filling this position (null if empty)
  filledByUserId: integer('filled_by_user_id').references(() => users.id),
  
  // Parent position (for Level 2 positions referencing Level 1)
  parentPositionId: integer('parent_position_id'),
  
  // Level: 1 or 2
  level: integer('level').notNull(),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Contributions - records of community contributions
 * These will eventually be on-chain TON transactions
 */
export const contributions = sqliteTable('contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('TON').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'failed'] }).default('pending').notNull(),
  
  // TON blockchain data
  txHash: text('tx_hash'),
  network: text('network', { enum: ['testnet', 'mainnet'] }).default('testnet').notNull(),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Rewards - community rewards tracking
 * Types: REFERRAL, MATRIX, COMMUNITY
 */
export const rewards = sqliteTable('rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type', { enum: ['REFERRAL', 'MATRIX', 'COMMUNITY'] }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('TON').notNull(),
  description: text('description').notNull(),
  
  // Related contribution (if applicable)
  contributionId: integer('contribution_id').references(() => contributions.id),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Type exports for TypeScript
 */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type MatrixPosition = typeof matrixPositions.$inferSelect
export type NewMatrixPosition = typeof matrixPositions.$inferInsert

export type Contribution = typeof contributions.$inferSelect
export type NewContribution = typeof contributions.$inferInsert

export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
