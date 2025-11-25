import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createDbClient } from '../db/client'
import { TonService } from '../services/ton.service'
import type { AuthEnv } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'

const tonRoutes = new Hono<AuthEnv>()

// Validation schemas
const linkWalletSchema = z.object({
  walletAddress: z.string().min(48).max(48),
  network: z.enum(['testnet', 'mainnet'])
})

/**
 * POST /api/ton/link-wallet
 * Link TON wallet to user account
 */
tonRoutes.post('/link-wallet', authMiddleware, zValidator('json', linkWalletSchema), async (c) => {
  try {
    const user = c.get('user')
    const { walletAddress, network } = c.req.valid('json')
    
    const db = createDbClient(c.env.DB)
    const tonNetwork = c.env.TON_NETWORK as 'testnet' | 'mainnet' || 'testnet'
    const tonApiEndpoint = c.env.TON_API_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC'
    const tonService = new TonService(db, tonNetwork, tonApiEndpoint)
    
    await tonService.linkWallet(user.id, walletAddress, network)
    
    return c.json({
      success: true,
      message: 'TON wallet linked successfully'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * GET /api/ton/status
 * Get TON connection status and on-chain data
 */
tonRoutes.get('/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    const db = createDbClient(c.env.DB)
    const tonNetwork = c.env.TON_NETWORK as 'testnet' | 'mainnet' || 'testnet'
    const tonApiEndpoint = c.env.TON_API_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC'
    const tonService = new TonService(db, tonNetwork, tonApiEndpoint)
    
    const onChainStatus = await tonService.getOnChainStatus(user.id)
    
    return c.json({
      success: true,
      data: {
        isConnected: !!user.tonWalletAddress,
        walletAddress: user.tonWalletAddress,
        network: user.tonNetwork,
        onChainStatus
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * GET /api/ton/contract-address
 * Get smart contract address for current network
 */
tonRoutes.get('/contract-address', authMiddleware, async (c) => {
  try {
    const db = createDbClient(c.env.DB)
    const tonNetwork = c.env.TON_NETWORK as 'testnet' | 'mainnet' || 'testnet'
    const tonApiEndpoint = c.env.TON_API_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC'
    const tonService = new TonService(db, tonNetwork, tonApiEndpoint)
    
    const contractAddress = tonService.getContractAddress()
    
    return c.json({
      success: true,
      data: {
        address: contractAddress,
        network: tonNetwork,
        explorer: tonService.getExplorerUrl('')
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default tonRoutes
