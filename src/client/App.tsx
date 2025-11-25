import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import TelegramApp from './pages/TelegramApp'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MatrixPage from './pages/MatrixPage'
import AdminPage from './pages/AdminPage'

// Auth provider configuration (invisible to UI)
const AUTH_CONFIG = {
  appId: import.meta.env.VITE_PRIVY_APP_ID || import.meta.env.VITE_AUTH_PROVIDER_APP_ID || '',
  config: {
    appearance: {
      // Minimal branding - provider modal will show but we don't add extra text
      theme: 'light',
      accentColor: '#0098EA', // TON blue
    },
    // Embedded wallets for seamless UX
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    }
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
    </div>
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
    </div>
  }
  
  return user?.isAdmin ? <>{children}</> : <Navigate to="/dashboard" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="telegram" element={<TelegramApp />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="join" element={<RegisterPage />} />
        
        <Route path="dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        
        <Route path="matrix" element={
          <PrivateRoute>
            <MatrixPage />
          </PrivateRoute>
        } />
        
        <Route path="admin" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <PrivyProvider
      appId={AUTH_CONFIG.appId}
      config={AUTH_CONFIG.config}
    >
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </PrivyProvider>
  )
}
