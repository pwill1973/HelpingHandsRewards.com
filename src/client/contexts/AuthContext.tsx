import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import type { UserProfile } from '@shared/types'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  walletAddress: string | null
  telegramUserId: string | null
  setWalletAddress: (address: string) => void
  setTelegramUserId: (id: string) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddressState] = useState<string | null>(null)
  const [telegramUserId, setTelegramUserIdState] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Check for existing JWT token
    const token = api.getToken()
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.getMe()
      if (response.success && response.data) {
        setUser(response.data)
        // Set wallet and telegram from user profile
        if (response.data.ton_wallet_address) {
          setWalletAddressState(response.data.ton_wallet_address)
        }
        if (response.data.telegram_user_id) {
          setTelegramUserIdState(response.data.telegram_user_id)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      api.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const setWalletAddress = (address: string) => {
    setWalletAddressState(address)
    // TODO: In Cursor phase, this will trigger TON Connect signature verification
    // For now, just store the address locally
  }

  const setTelegramUserId = (id: string) => {
    setTelegramUserIdState(id)
    // TODO: In Cursor phase, this will verify Telegram WebApp init data
    // For now, just store the ID locally
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    
    // Clear local state
    setUser(null)
    setWalletAddressState(null)
    setTelegramUserIdState(null)
    api.setToken(null)
  }

  const refreshUser = async () => {
    try {
      const response = await api.getMe()
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        walletAddress,
        telegramUserId,
        setWalletAddress,
        setTelegramUserId,
        logout, 
        refreshUser,
        isAuthenticated: !!walletAddress || !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
