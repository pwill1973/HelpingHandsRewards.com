/**
 * Shared types between client and server
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UserProfile {
  id: number
  email: string
  fullName: string
  username: string
  memberCode: string
  referralCode: string
  country?: string | null
  tonWalletAddress?: string | null
  tonNetwork?: 'testnet' | 'mainnet'
  referredById?: number | null
  isAdmin: boolean
  createdAt: string
  sponsor?: {
    id: number
    fullName: string
    memberCode: string
  }
}

export interface MatrixLevel {
  id: number
  level: number
  amount: number
  currency: string
}

export interface MatrixPositionData {
  id: number
  matrixInstanceId: number
  slotNumber: number
  filledByUserId?: number | null
  filledAt?: string | null
  filledByUser?: {
    id: number
    fullName: string
    memberCode: string
    username: string
  } | null
}

export interface MatrixInstanceData {
  id: number
  userId: number
  levelId: number
  cycleNumber: number
  status: 'OPEN' | 'FILLED'
  createdAt: string
}

export interface MatrixView {
  level: MatrixLevel
  instance: MatrixInstanceData
  positions: MatrixPositionData[]
  owner: {
    id: number
    fullName: string
    memberCode: string
  }
}

export interface UserLevelStatus {
  level: MatrixLevel
  isActivated: boolean
  matrixCount: number
  lastCycle?: number
}

export interface ContributionData {
  id: number
  userId: number
  amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'failed'
  txHash?: string | null
  network: 'testnet' | 'mainnet'
  createdAt: string
}

export interface RewardData {
  id: number
  userId: number
  type: 'REFERRAL' | 'MATRIX' | 'COMMUNITY'
  amount: number
  currency: string
  description: string
  createdAt: string
}

export interface DashboardStats {
  personalReferrals: number
  matrixMembers: number
  totalDownline: number
  totalContributions: number
  totalRewards: number
}

export interface AdminStats {
  totalUsers: number
  totalContributions: {
    count: number
    sum: number
  }
  matrixDistribution: {
    empty: number
    partial: number
    full: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  country?: string
  referralCode?: string
  selectedLevels: number[] // Array of level IDs to activate (e.g., [1, 2, 3] for levels 5, 10, 20)
}

export interface LinkWalletRequest {
  walletAddress: string
  network: 'testnet' | 'mainnet'
}

export interface TonStatusResponse {
  isConnected: boolean
  walletAddress?: string
  network?: 'testnet' | 'mainnet'
  onChainStatus: {
    isActive: boolean
    contributions: number
    lastActivity?: string
  }
}
