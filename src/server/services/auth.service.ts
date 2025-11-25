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
      email: user.email,
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
