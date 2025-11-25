import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import type { UserProfile, LoginRequest, RegisterRequest } from '@shared/types'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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

  const login = async (data: LoginRequest) => {
    const response = await api.login(data)
    if (response.success && response.data) {
      setUser(response.data.user)
    }
  }

  const register = async (data: RegisterRequest) => {
    const response = await api.register(data)
    if (response.success && response.data) {
      setUser(response.data.user)
    }
  }

  const logout = async () => {
    await api.logout()
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
