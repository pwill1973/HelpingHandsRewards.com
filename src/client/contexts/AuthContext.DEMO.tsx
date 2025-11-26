import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setLoading(false)
        return
      }

      api.setToken(token)
      const userData = await api.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
    } finally {
      setLoading(false)
    }
  }

  // Modern authentication (DEMO - just shows alert)
  const authenticateUser = async () => {
    alert('DEMO MODE: Privy authentication would trigger here. For demo purposes, the bilingual UI and RegisterPage work without authentication.')
    throw new Error('Demo mode - authentication disabled')
  }

  // Legacy email/password login
  const login = async (data: LoginRequest) => {
    const response = await api.login(data)
    if (response.token) {
      localStorage.setItem('authToken', response.token)
      api.setToken(response.token)
      setUser(response.user)
    }
  }

  // Legacy registration
  const register = async (data: RegisterRequest) => {
    const response = await api.register(data)
    if (response.token) {
      localStorage.setItem('authToken', response.token)
      api.setToken(response.token)
      setUser(response.user)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('authToken')
      api.setToken(null)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authenticateUser,
      login, 
      register, 
      logout, 
      refreshUser, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
