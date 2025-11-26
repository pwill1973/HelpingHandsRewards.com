import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { DbClient } from '../db/client'
import { users } from '../db/schema'
import { generateCode, generateUsername } from '@shared/utils'
import type { RegisterRequest, UserProfile } from '@shared/types'

const SALT_ROUNDS = 10

/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */
export class AuthService {
  constructor(
    private db: DbClient,
    private jwtSecret: string
  ) {}

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<UserProfile> {
    // Check if email already exists
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase())
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    // Generate unique codes
    const username = generateUsername(data.email)
    const memberCode = await this.generateUniqueMemberCode()
    const referralCode = await this.generateUniqueReferralCode()

    // Resolve referral if provided
    let referredById: number | undefined
    if (data.referralCode) {
      const sponsor = await this.db.query.users.findFirst({
        where: eq(users.referralCode, data.referralCode)
      })
      
      if (!sponsor) {
        throw new Error('Invalid referral code')
      }
      
      referredById = sponsor.id
    }

    // Create user
    const result: any = await this.db.insert(users).values({
      email: data.email.toLowerCase(),
      passwordHash,
      fullName: data.fullName,
      username,
      memberCode,
      referralCode,
      country: data.country,
      referredById,
      isAdmin: false
    }).returning()

    const newUser = result[0]
    return this.toUserProfile(newUser)
  }

  /**
   * Login user and generate JWT token
   */
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    const token = await this.generateToken(user.id)
    return { user: this.toUserProfile(user), token }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<UserProfile | null> {
    try {
      const secret = new TextEncoder().encode(this.jwtSecret)
      const { payload } = await jwtVerify(token, secret)
      
      const userId = payload.sub as string
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, parseInt(userId))
      })

      return user ? this.toUserProfile(user) : null
    } catch {
      return null
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) return null

    // Get sponsor info if available
    let sponsor
    if (user.referredById) {
      const sponsorUser = await this.db.query.users.findFirst({
        where: eq(users.id, user.referredById),
        columns: { id: true, fullName: true, memberCode: true }
      })
      sponsor = sponsorUser || undefined
    }

    return {
      ...this.toUserProfile(user),
      sponsor
    }
  }

  /**
   * Find or create user by auth provider ID
   * Used for seamless auth provider integration
   * 
   * Enhanced to support identity merging when same person has multiple entry points
   */
  async findOrCreateUserByProviderId(
    providerId: string,
    metadata?: { email?: string; walletAddress?: string; telegramUserId?: string }
  ): Promise<UserProfile> {
    // Step 1: Try to find existing user by provider ID (primary identity)
    let user = await this.db.query.users.findFirst({
      where: eq(users.privyUserId, providerId)
    })

    if (user) {
      // User exists with this provider ID
      // If metadata has new wallet or telegram, merge them
      const updates: any = {}
      if (metadata?.walletAddress && !user.tonWalletAddress) {
        updates.tonWalletAddress = metadata.walletAddress
      }
      if (metadata?.telegramUserId && !user.telegramUserId) {
        updates.telegramUserId = metadata.telegramUserId
      }
      
      if (Object.keys(updates).length > 0) {
        await this.db.update(users).set(updates).where(eq(users.id, user.id))
        // Refresh user data
        user = await this.db.query.users.findFirst({ where: eq(users.id, user.id) })
      }
      
      return this.toUserProfile(user!)
    }

    // Step 2: Check if user exists with same wallet address (merge scenario)
    if (metadata?.walletAddress) {
      const userByWallet = await this.db.query.users.findFirst({
        where: eq(users.tonWalletAddress, metadata.walletAddress)
      })
      
      if (userByWallet) {
        // Found user with same wallet - merge provider ID into existing account
        await this.db.update(users)
          .set({ 
            privyUserId: providerId,
            telegramUserId: metadata.telegramUserId || userByWallet.telegramUserId
          })
          .where(eq(users.id, userByWallet.id))
        
        // Return merged user
        const mergedUser = await this.db.query.users.findFirst({
          where: eq(users.id, userByWallet.id)
        })
        return this.toUserProfile(mergedUser!)
      }
    }

    // Step 3: Check if user exists with same Telegram ID (merge scenario)
    if (metadata?.telegramUserId) {
      const userByTelegram = await this.db.query.users.findFirst({
        where: eq(users.telegramUserId, metadata.telegramUserId)
      })
      
      if (userByTelegram) {
        // Found user with same Telegram ID - merge provider ID into existing account
        await this.db.update(users)
          .set({ 
            privyUserId: providerId,
            tonWalletAddress: metadata.walletAddress || userByTelegram.tonWalletAddress
          })
          .where(eq(users.id, userByTelegram.id))
        
        // Return merged user
        const mergedUser = await this.db.query.users.findFirst({
          where: eq(users.id, userByTelegram.id)
        })
        return this.toUserProfile(mergedUser!)
      }
    }

    // Step 4: No existing user found - create new account
    const username = generateUsername(metadata?.email || `user_${providerId.slice(0, 8)}`)
    const memberCode = await this.generateUniqueMemberCode()
    const referralCode = await this.generateUniqueReferralCode()

    const result: any = await this.db.insert(users).values({
      privyUserId: providerId,
      email: metadata?.email?.toLowerCase() || null,
      passwordHash: null, // No password for auth provider users
      fullName: metadata?.email?.split('@')[0] || 'Community Member',
      username,
      memberCode,
      referralCode,
      tonWalletAddress: metadata?.walletAddress || null,
      telegramUserId: metadata?.telegramUserId || null,
      isAdmin: false
    }).returning()

    const newUser = result[0]
    return this.toUserProfile(newUser)
  }

  /**
   * Link Telegram user ID to existing user
   */
  async linkTelegramUser(userId: number, telegramUserId: string): Promise<void> {
    await this.db.update(users)
      .set({ telegramUserId })
      .where(eq(users.id, userId))
  }

  /**
   * Find user by Telegram user ID
   */
  async findUserByTelegramId(telegramUserId: string): Promise<UserProfile | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.telegramUserId, telegramUserId)
    })

    return user ? this.toUserProfile(user) : null
  }

  /**
   * Generate JWT token
   */
  private async generateToken(userId: number): Promise<string> {
    const secret = new TextEncoder().encode(this.jwtSecret)
    
    const token = await new SignJWT({ })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId.toString())
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    return token
  }

  /**
   * Generate unique member code
   */
  private async generateUniqueMemberCode(): Promise<string> {
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = `M${generateCode(7)}`
      const existing = await this.db.query.users.findFirst({
        where: eq(users.memberCode, code)
      })
      
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique member code')
    }

    return code
  }

  /**
   * Generate unique referral code
   */
  private async generateUniqueReferralCode(): Promise<string> {
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateCode(8)
      const existing = await this.db.query.users.findFirst({
        where: eq(users.referralCode, code)
      })
      
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique referral code')
    }

    return code
  }

  /**
   * Convert database user to UserProfile
   */
  private toUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      privyUserId: user.privyUserId || undefined,
      telegramUserId: user.telegramUserId || undefined,
      email: user.email || undefined,
      fullName: user.fullName,
      username: user.username,
      memberCode: user.memberCode,
      referralCode: user.referralCode,
      country: user.country,
      tonWalletAddress: user.tonWalletAddress,
      tonNetwork: user.tonNetwork as 'testnet' | 'mainnet',
      referredById: user.referredById,
      isAdmin: Boolean(user.isAdmin),
      createdAt: user.createdAt
    }
  }
}
