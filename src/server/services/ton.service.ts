import { eq } from 'drizzle-orm'
import type { DbClient } from '../db/client'
import { users } from '../db/schema'
import { isValidTonAddress } from '@shared/utils'

/**
 * TON Service
 * Abstraction layer for TON blockchain integration
 * 
 * IMPORTANT: This is a stub implementation for development.
 * In production, these methods will interact with:
 * - TON smart contracts (via ton-core or tonweb)
 * - TON Center API for transaction verification
 * - TON Connect for wallet integration
 * 
 * TODO: Replace stub implementations with real TON blockchain calls
 */

export interface ContributionIntent {
  intentId: string
  amount: number
  currency: string
  destinationAddress: string
  payload?: string
  memo?: string
}

export interface VerificationResult {
  isValid: boolean
  txHash?: string
  amount?: number
  from?: string
  to?: string
  timestamp?: string
  error?: string
}

export interface OnChainStatus {
  isActive: boolean
  totalContributions: number
  lastActivityTimestamp?: string
  matrixLevel?: number
  rewardsEarned?: number
}

export class TonService {
  constructor(
    private db: DbClient,
    private tonNetwork: 'testnet' | 'mainnet',
    private tonApiEndpoint: string
  ) {}

  /**
   * Link TON wallet to user account
   * 
   * CRITICAL: Supports identity merging when same wallet connects from different entry points
   * (e.g., user starts on Telegram, later connects same wallet on web)
   */
  async linkWallet(userId: number, walletAddress: string, network: 'testnet' | 'mainnet'): Promise<{ merged: boolean; mergedUserId?: number }> {
    // Validate address format
    if (!isValidTonAddress(walletAddress)) {
      throw new Error('Invalid TON wallet address format')
    }

    // Check if wallet is already linked to another user
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.tonWalletAddress, walletAddress)
    })

    if (existingUser && existingUser.id !== userId) {
      // CRITICAL DECISION POINT: Wallet exists on different account
      // This can happen when same person has two separate accounts:
      // - One from website (privy_user_id only)
      // - One from Telegram (telegram_user_id only)
      // We need to determine which account to keep
      
      const currentUser = await this.db.query.users.findFirst({
        where: eq(users.id, userId)
      })

      if (!currentUser) {
        throw new Error('Current user not found')
      }

      // Merge strategy: Prefer the account with more identity anchors
      // If they're equal, prefer the older account (lower ID)
      const currentAnchors = [
        currentUser.privyUserId,
        currentUser.telegramUserId,
        currentUser.tonWalletAddress
      ].filter(Boolean).length

      const existingAnchors = [
        existingUser.privyUserId,
        existingUser.telegramUserId,
        existingUser.tonWalletAddress
      ].filter(Boolean).length

      // Determine which account to merge INTO
      let primaryUser, secondaryUser
      if (currentAnchors > existingAnchors) {
        primaryUser = currentUser
        secondaryUser = existingUser
      } else if (existingAnchors > currentAnchors) {
        primaryUser = existingUser
        secondaryUser = currentUser
      } else {
        // Equal anchors - prefer older account (lower ID)
        if (currentUser.id < existingUser.id) {
          primaryUser = currentUser
          secondaryUser = existingUser
        } else {
          primaryUser = existingUser
          secondaryUser = currentUser
        }
      }

      // Merge identities: Copy missing anchors to primary account
      const updates: any = {}
      if (!primaryUser.privyUserId && secondaryUser.privyUserId) {
        updates.privyUserId = secondaryUser.privyUserId
      }
      if (!primaryUser.telegramUserId && secondaryUser.telegramUserId) {
        updates.telegramUserId = secondaryUser.telegramUserId
      }
      if (!primaryUser.tonWalletAddress && secondaryUser.tonWalletAddress) {
        updates.tonWalletAddress = secondaryUser.tonWalletAddress
        updates.tonNetwork = secondaryUser.tonNetwork
      }

      // Apply merge
      if (Object.keys(updates).length > 0) {
        await this.db.update(users)
          .set(updates)
          .where(eq(users.id, primaryUser.id))
      }

      // TODO: In future, also migrate:
      // - Matrix instances
      // - Contributions
      // - Rewards
      // Then delete secondary account

      console.log(`[TonService] Identity merge detected: User ${secondaryUser.id} merged into User ${primaryUser.id}`)

      return {
        merged: true,
        mergedUserId: primaryUser.id
      }
    }

    // No conflict - simple wallet link
    await this.db.update(users)
      .set({ 
        tonWalletAddress: walletAddress,
        tonNetwork: network
      })
      .where(eq(users.id, userId))

    return { merged: false }
  }

  /**
   * Create a contribution intent
   * 
   * TODO: In production, this should:
   * 1. Generate a unique payment reference
   * 2. Create a TON Connect transaction request
   * 3. Return destination address and payload for smart contract call
   * 4. Store intent in database for later verification
   */
  async createContributionIntent(userId: number, amount: number): Promise<ContributionIntent> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Stub implementation
    const intentId = `intent_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // TODO: Replace with real smart contract address
    const destinationAddress = this.tonNetwork === 'mainnet' 
      ? 'EQBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
      : 'EQAyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'

    // TODO: Generate proper smart contract payload
    const payload = JSON.stringify({
      userId: user.id,
      memberCode: user.memberCode,
      intentId,
      timestamp: Date.now()
    })

    console.log('[TonService] Created contribution intent:', {
      intentId,
      userId,
      amount,
      network: this.tonNetwork
    })

    return {
      intentId,
      amount,
      currency: 'TON',
      destinationAddress,
      payload,
      memo: `Contribution for member ${user.memberCode}`
    }
  }

  /**
   * Verify a contribution transaction
   * 
   * TODO: In production, this should:
   * 1. Call TON Center API to fetch transaction by hash
   * 2. Verify transaction destination matches our contract
   * 3. Verify transaction amount
   * 4. Decode and validate payload/memo
   * 5. Check transaction status (confirmed, pending, failed)
   */
  async verifyContribution(txHash: string): Promise<VerificationResult> {
    console.log('[TonService] Verifying contribution:', { txHash, network: this.tonNetwork, endpoint: this.tonApiEndpoint })

    // Stub implementation - always returns success
    // TODO: Replace with real TON API calls
    /*
    Example real implementation:
    
    const response = await fetch(
      `${this.tonApiEndpoint}/getTransactions?address=${contractAddress}&limit=1&hash=${txHash}`
    )
    const data = await response.json()
    
    if (data.ok && data.result.length > 0) {
      const tx = data.result[0]
      return {
        isValid: true,
        txHash: tx.hash,
        amount: parseInt(tx.in_msg.value) / 1e9, // Convert from nanoton
        from: tx.in_msg.source,
        to: tx.in_msg.destination,
        timestamp: new Date(tx.utime * 1000).toISOString()
      }
    }
    */

    return {
      isValid: true,
      txHash,
      amount: 10.0,
      from: 'EQBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      to: 'EQAyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get on-chain status for a user
   * 
   * TODO: In production, this should:
   * 1. Query smart contract for user's on-chain state
   * 2. Fetch contribution history from blockchain
   * 3. Get current matrix position from contract
   * 4. Calculate rewards earned
   */
  async getOnChainStatus(userId: number): Promise<OnChainStatus> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user || !user.tonWalletAddress) {
      return {
        isActive: false,
        totalContributions: 0
      }
    }

    console.log('[TonService] Getting on-chain status:', {
      userId,
      walletAddress: user.tonWalletAddress,
      network: this.tonNetwork
    })

    // Stub implementation
    // TODO: Replace with real smart contract queries
    /*
    Example real implementation:
    
    const contractAddress = getContractAddress(this.tonNetwork)
    const client = new TonClient({ endpoint: this.tonApiEndpoint })
    
    const contract = client.open(CommunityMatrixContract.fromAddress(contractAddress))
    const userState = await contract.getUserState(user.tonWalletAddress)
    
    return {
      isActive: userState.isActive,
      totalContributions: userState.contributionsCount,
      lastActivityTimestamp: userState.lastActivityTime?.toISOString(),
      matrixLevel: userState.matrixLevel,
      rewardsEarned: userState.totalRewards / 1e9
    }
    */

    return {
      isActive: false,
      totalContributions: 0,
      lastActivityTimestamp: undefined,
      matrixLevel: 1,
      rewardsEarned: 0
    }
  }

  /**
   * Get smart contract address for current network
   * 
   * TODO: Set real contract addresses after deployment
   */
  getContractAddress(): string {
    return this.tonNetwork === 'mainnet'
      ? 'EQBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // TODO: Set mainnet contract
      : 'EQAyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' // TODO: Set testnet contract
  }

  /**
   * Get TON Explorer URL for transaction
   */
  getExplorerUrl(txHash: string): string {
    const baseUrl = this.tonNetwork === 'mainnet'
      ? 'https://tonscan.org'
      : 'https://testnet.tonscan.org'
    
    return `${baseUrl}/tx/${txHash}`
  }
}
