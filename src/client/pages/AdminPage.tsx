import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { AdminStats } from '@shared/types'

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminStats()
  }, [])

  const loadAdminStats = async () => {
    try {
      const response = await api.getAdminStats()
      if (response.success) {
        setStats(response.data as AdminStats)
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">Failed to load admin statistics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Admin Dashboard
        </h1>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Users
            </h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {stats.totalUsers}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Contributions
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalContributions.count}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total: {stats.totalContributions.sum.toFixed(2)} TON
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Active Matrices
            </h3>
            <p className="text-4xl font-bold text-ton-blue">
              {stats.matrixDistribution.full + stats.matrixDistribution.partial}
            </p>
          </div>
        </div>

        {/* Matrix Distribution */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Matrix Distribution
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Empty Matrices (0-1 positions filled)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.matrixDistribution.empty}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(stats.matrixDistribution.empty / stats.totalUsers) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Partial Matrices (2-3 positions filled)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.matrixDistribution.partial}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(stats.matrixDistribution.partial / stats.totalUsers) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Full Matrices (4-6 positions filled)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.matrixDistribution.full}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(stats.matrixDistribution.full / stats.totalUsers) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            System Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Platform</span>
              <span className="font-medium text-gray-900 dark:text-white">Cloudflare Pages + D1</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Blockchain</span>
              <span className="font-medium text-gray-900 dark:text-white">TON (Testnet)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Matrix Type</span>
              <span className="font-medium text-gray-900 dark:text-white">2×2 Community Matrix</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
