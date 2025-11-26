import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { api } from '../services/api'
import { authProviderClient } from '../services/authProviderClient'
import type { UserProfile, LoginRequest, RegisterRequest } from '@shared/types'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  // Modern auth methods (provider-based)
  authenticateUser: () => Promise<void>
  // Legacy auth methods (email/password)
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Auth provider integration (invisible to UI)
  const privyAuth = usePrivy()
  
  // Initialize auth provider client
  useEffect(() => {
    if (privyAuth) {
      const appId = import.meta.env.VITE_PRIVY_APP_ID || import.meta.env.VITE_AUTH_PROVIDER_APP_ID
      authProviderClient.initialize(privyAuth, { appId })
    }
  }, [privyAuth])

  useEffect(() => {
    checkAuth()
  }, [privyAuth.authenticated])

  const checkAuth = async () => {
    // Priority 1: Check for auth provider session
    if (privyAuth.authenticated) {
      try {
        // Get auth provider token
        const authToken = await authProviderClient.getAuthToken()
        
        if (authToken) {
          // Verify session with backend
          const response = await fetch('/api/auth/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken })
          })
          
          const data = await response.json()
          
          if (data.success && data.data) {
            // Store JWT token for subsequent API calls
            api.setToken(data.data.token)
            setUser(data.data.user)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Provider auth verification failed:', error)
      }
    }
    
    // Priority 2: Check for existing JWT token (legacy or post-provider-login)
    const token = api.getToken()
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.getMe()
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      api.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Modern authentication flow (provider-based)
   * UI calls this with generic buttons: "Continue", "Join Community"
   */
  const authenticateUser = async () => {
    try {
      // Trigger provider authentication
      await authProviderClient.authenticateUser()
      
      // After successful auth, checkAuth will be called automatically
      // due to the useEffect dependency on privyAuth.authenticated
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  /**
   * Legacy email/password login
   * Kept for backward compatibility
   */
  const login = async (data: LoginRequest) => {
    const response = await api.login(data)
    if (response.success && response.data) {
      setUser(response.data.user)
    }
  }

  /**
   * Legacy email/password registration
   * Kept for backward compatibility
   */
  const register = async (data: RegisterRequest) => {
    const response = await api.register(data)
    if (response.success && response.data) {
      setUser(response.data.user)
    }
  }

  /**
   * Logout user from both provider and backend
   */
  const logout = async () => {
    // Logout from provider
    await authProviderClient.disconnectUser()
    
    // Logout from backend
    await api.logout()
    
    // Clear local state
    setUser(null)
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
        // Modern auth (provider-based)
        authenticateUser,
        // Legacy auth (email/password)
        login, 
        register, 
        logout, 
        refreshUser,
        isAuthenticated: !!user 
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
