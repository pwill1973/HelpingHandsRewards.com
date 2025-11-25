/**
 * Auth Provider Service
 * 
 * Handles verification of authentication tokens from the identity provider.
 * This is an internal service - the provider name never appears in UI/copy.
 */

import { PrivyClient } from '@privy-io/server-auth'

interface AuthProviderConfig {
  appId: string
  appSecret: string
}

interface VerifiedUser {
  userId: string // Provider's unique user ID
  email?: string
  walletAddress?: string
}

export class AuthProviderService {
  private client: PrivyClient | null = null
  private config: AuthProviderConfig

  constructor(config: AuthProviderConfig) {
    this.config = config
    this.initializeClient()
  }

  private initializeClient() {
    try {
      this.client = new PrivyClient(
        this.config.appId,
        this.config.appSecret
      )
    } catch (error) {
      console.error('Failed to initialize auth provider client:', error)
      throw new Error('Auth provider configuration error')
    }
  }

  /**
   * Verify an access token from the frontend
   * Returns the verified user identity
   */
  async verifyAccessToken(token: string): Promise<VerifiedUser> {
    if (!this.client) {
      throw new Error('Auth provider client not initialized')
    }

    try {
      // Verify the token with the auth provider
      const verifiedClaims = await this.client.verifyAuthToken(token)
      
      // Extract user identity information
      return {
        userId: verifiedClaims.userId,
        email: this.extractEmail(verifiedClaims),
        walletAddress: this.extractWalletAddress(verifiedClaims)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      throw new Error('Invalid authentication token')
    }
  }

  /**
   * Get user by provider user ID
   */
  async getUserById(userId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Auth provider client not initialized')
    }

    try {
      const user = await this.client.getUser(userId)
      return user
    } catch (error) {
      console.error('Failed to fetch user from provider:', error)
      throw new Error('User not found')
    }
  }

  /**
   * Extract email from verified claims
   */
  private extractEmail(claims: any): string | undefined {
    // Handle different claim structures from the provider
    if (claims.email) return claims.email
    
    // Check linked accounts
    const linkedAccounts = claims.linkedAccounts || []
    const emailAccount = linkedAccounts.find((acc: any) => 
      acc.type === 'email' || acc.email
    )
    
    return emailAccount?.email || emailAccount?.address
  }

  /**
   * Extract wallet address from verified claims
   */
  private extractWalletAddress(claims: any): string | undefined {
    const linkedAccounts = claims.linkedAccounts || []
    const walletAccount = linkedAccounts.find((acc: any) => 
      acc.type === 'wallet' && (acc.chainType === 'ton' || acc.chainType === 'ethereum')
    )
    
    return walletAccount?.address
  }
}

/**
 * Create a singleton instance for the auth provider service
 */
export function createAuthProviderService(env: any): AuthProviderService {
  const appId = env.AUTH_PROVIDER_APP_ID || env.PRIVY_APP_ID
  const appSecret = env.AUTH_PROVIDER_APP_SECRET || env.PRIVY_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('Auth provider credentials not configured')
  }

  return new AuthProviderService({
    appId,
    appSecret
  })
}
