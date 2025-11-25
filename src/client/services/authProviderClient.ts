/**
 * Auth Provider Client - Invisible Integration
 * 
 * This service wraps the authentication provider SDK with a generic API.
 * The provider name is never exposed to UI components or user-facing code.
 * 
 * User-facing wording: "Continue", "Join the Community", "Secure Login"
 */

import type { PrivyInterface } from '@privy-io/react-auth'

export interface AuthSession {
  isAuthenticated: boolean
  userId?: string
  email?: string
  walletAddress?: string
}

export interface AuthConfig {
  appId: string
}

/**
 * Auth Provider Client
 * Handles authentication without exposing provider details to UI
 */
export class AuthProviderClient {
  private client: PrivyInterface | null = null
  private config: AuthConfig | null = null

  /**
   * Initialize the auth provider
   * Called internally by AuthContext
   */
  initialize(client: PrivyInterface, config: AuthConfig): void {
    this.client = client
    this.config = config
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.client) return false
    return this.client.authenticated
  }

  /**
   * Get current session information
   */
  getSession(): AuthSession {
    if (!this.client || !this.client.authenticated) {
      return { isAuthenticated: false }
    }

    const user = this.client.user
    
    return {
      isAuthenticated: true,
      userId: user?.id,
      email: this.extractEmail(user),
      walletAddress: this.extractWalletAddress(user)
    }
  }

  /**
   * Get auth token for backend verification
   */
  async getAuthToken(): Promise<string | null> {
    if (!this.client) return null
    
    try {
      const token = await this.client.getAccessToken()
      return token
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return null
    }
  }

  /**
   * Trigger authentication flow
   * UI should call this with generic button like "Continue" or "Join Community"
   */
  async authenticateUser(): Promise<void> {
    if (!this.client) {
      throw new Error('Auth client not initialized')
    }

    return this.client.login()
  }

  /**
   * Disconnect user session
   * UI should call this with generic "Logout" button
   */
  async disconnectUser(): Promise<void> {
    if (!this.client) return
    
    try {
      await this.client.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  /**
   * Extract email from user object
   */
  private extractEmail(user: any): string | undefined {
    if (!user) return undefined
    
    // Check email field
    if (user.email?.address) return user.email.address
    
    // Check linked accounts
    const linkedAccounts = user.linkedAccounts || []
    const emailAccount = linkedAccounts.find((acc: any) => 
      acc.type === 'email'
    )
    
    return emailAccount?.address
  }

  /**
   * Extract wallet address from user object
   */
  private extractWalletAddress(user: any): string | undefined {
    if (!user) return undefined
    
    // Check wallet field
    if (user.wallet?.address) return user.wallet.address
    
    // Check linked accounts
    const linkedAccounts = user.linkedAccounts || []
    const walletAccount = linkedAccounts.find((acc: any) => 
      acc.type === 'wallet'
    )
    
    return walletAccount?.address
  }
}

/**
 * Singleton instance
 * Initialized by AuthContext
 */
export const authProviderClient = new AuthProviderClient()
