import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Users table - stores all user accounts
 */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Identity anchors (multiple ways to identify the same user)
  privyUserId: text('privy_user_id').unique(), // Primary identity from auth provider
  telegramUserId: text('telegram_user_id'), // Telegram user ID for mini-app
  
  // Legacy auth fields (kept for backward compatibility)
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  
  // Profile
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  memberCode: text('member_code').notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  country: text('country'),
  
  // TON Integration
  tonWalletAddress: text('ton_wallet_address'),
  tonNetwork: text('ton_network', { enum: ['testnet', 'mainnet'] }).default('testnet'),
  
  // Referral relationship
  referredById: integer('referred_by_id'),
  
  // Admin flag
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Matrix Levels - defines the 10 contribution levels
 * Amounts: 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560 USDT-TON
 */
export const matrixLevels = sqliteTable('matrix_levels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: integer('level').notNull().unique(), // 1-10
  amount: real('amount').notNull(), // 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560
  currency: text('currency').default('USDT-TON').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Matrix Instances - one per user per level
 * Each user can have multiple matrix instances per level (due to re-entry)
 */
export const matrixInstances = sqliteTable('matrix_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  levelId: integer('level_id').notNull().references(() => matrixLevels.id),
  cycleNumber: integer('cycle_number').default(1).notNull(), // Increments with each re-entry
  status: text('status', { enum: ['OPEN', 'FILLED'] }).default('OPEN').notNull(),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Matrix Positions - exactly 6 positions per matrix instance
 * Slot numbers: 1, 2, 3, 4, 5, 6 (fixed order)
 * 
 * Structure:
 *          [YOU]
 *         /     \
 *     [1]       [2]
 *    /  \       /  \
 *  [3]  [5]   [4]  [6]
 */
export const matrixPositions = sqliteTable('matrix_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matrixInstanceId: integer('matrix_instance_id').notNull().references(() => matrixInstances.id),
  slotNumber: integer('slot_number').notNull(), // 1-6 (fixed order)
  filledByUserId: integer('filled_by_user_id').references(() => users.id),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  filledAt: text('filled_at')
})

/**
 * Contributions - records of community contributions
 */
export const contributions = sqliteTable('contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  levelId: integer('level_id').notNull().references(() => matrixLevels.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('USDT-TON').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'failed'] }).default('pending').notNull(),
  
  // TON blockchain data
  txHash: text('tx_hash'),
  network: text('network', { enum: ['testnet', 'mainnet'] }).default('testnet').notNull(),
  
  // Related matrix instance
  matrixInstanceId: integer('matrix_instance_id').references(() => matrixInstances.id),
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Rewards - community rewards tracking
 * Types: DIRECT (positions 3,4), UPGRADE (position 5), REENTRY (position 6)
 */
export const rewards = sqliteTable('rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  levelId: integer('level_id').notNull().references(() => matrixLevels.id),
  type: text('type', { enum: ['DIRECT', 'UPGRADE', 'REENTRY', 'REFERRAL'] }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USDT-TON').notNull(),
  description: text('description').notNull(),
  
  // Related records
  contributionId: integer('contribution_id').references(() => contributions.id),
  matrixInstanceId: integer('matrix_instance_id').references(() => matrixInstances.id),
  fromUserId: integer('from_user_id').references(() => users.id), // Who triggered this reward
  
  // Timestamps
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * User Level Activations - tracks which levels a user has activated
 */
export const userLevelActivations = sqliteTable('user_level_activations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  levelId: integer('level_id').notNull().references(() => matrixLevels.id),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  activatedAt: text('activated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

/**
 * Type exports for TypeScript
 */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type MatrixLevel = typeof matrixLevels.$inferSelect
export type NewMatrixLevel = typeof matrixLevels.$inferInsert

export type MatrixInstance = typeof matrixInstances.$inferSelect
export type NewMatrixInstance = typeof matrixInstances.$inferInsert

export type MatrixPosition = typeof matrixPositions.$inferSelect
export type NewMatrixPosition = typeof matrixPositions.$inferInsert

export type Contribution = typeof contributions.$inferSelect
export type NewContribution = typeof contributions.$inferInsert

export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert

export type UserLevelActivation = typeof userLevelActivations.$inferSelect
export type NewUserLevelActivation = typeof userLevelActivations.$inferInsert
