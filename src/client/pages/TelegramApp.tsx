import { useEffect, useState } from 'react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { shortenAddress, formatCurrency, getPositionLabel } from '@shared/utils'
import type { MatrixView, DashboardStats, MatrixLevel } from '@shared/types'

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
        }
        ready: () => void
        expand: () => void
        MainButton: {
          setText: (text: string) => void
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
        }
      }
    }
  }
}

type Tab = 'levels' | 'matrix' | 'rewards'

export default function TelegramApp() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const [tonConnectUI] = useTonConnectUI()
  const tonAddress = useTonAddress()
  
  const [activeTab, setActiveTab] = useState<Tab>('levels')
  const [levels, setLevels] = useState<MatrixLevel[]>([])
  const [userLevels, setUserLevels] = useState<MatrixLevel[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [matrixData, setMatrixData] = useState<MatrixView | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      setIsTelegram(true)
      
      // You can access Telegram user data here
      const telegramUser = tg.initDataUnsafe?.user
      console.log('Telegram user:', telegramUser)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (tonAddress && !user?.tonWalletAddress) {
      handleLinkWallet()
    }
  }, [tonAddress, user?.tonWalletAddress])

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      // For now, use mock data until endpoints are added
      setLevels([
        { id: 1, level: 1, amount: 5, currency: 'USDT-TON' },
        { id: 2, level: 2, amount: 10, currency: 'USDT-TON' },
        { id: 3, level: 3, amount: 20, currency: 'USDT-TON' },
        { id: 4, level: 4, amount: 40, currency: 'USDT-TON' },
        { id: 5, level: 5, amount: 80, currency: 'USDT-TON' },
        { id: 6, level: 6, amount: 160, currency: 'USDT-TON' },
        { id: 7, level: 7, amount: 320, currency: 'USDT-TON' },
        { id: 8, level: 8, amount: 640, currency: 'USDT-TON' },
        { id: 9, level: 9, amount: 1280, currency: 'USDT-TON' },
        { id: 10, level: 10, amount: 2560, currency: 'USDT-TON' }
      ])
      
      // Load user data
      const [statsRes, rewardsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRewards()
      ])

      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (rewardsRes.success && rewardsRes.data) setRewards(rewardsRes.data)
      
      // Set first level as selected
      setSelectedLevelId(1)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatrixForLevel = async (levelId: number) => {
    try {
      const response = await api.getMatrixForUser(levelId)
      if (response.success && response.data) {
        setMatrixData(response.data)
      }
    } catch (error) {
      console.error('Failed to load matrix:', error)
    }
  }

  useEffect(() => {
    if (selectedLevelId && activeTab === 'matrix') {
      loadMatrixForLevel(selectedLevelId)
    }
  }, [selectedLevelId, activeTab])

  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleLinkWallet = async () => {
    if (!tonAddress) return
    
    try {
      await api.linkWallet({
        walletAddress: tonAddress,
        network: 'testnet'
      })
      await refreshUser()
    } catch (error) {
      console.error('Failed to link wallet:', error)
    }
  }

  const isLevelActive = (levelId: number) => {
    return userLevels.some(l => l.id === levelId)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-ton-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to HelpingHandsRewards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access the Telegram Mini-App
          </p>
          <a
            href="/login"
            className="btn-primary w-full inline-block"
          >
            Sign In
          </a>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Don't have an account? <a href="/join" className="text-ton-blue hover:underline">Join now</a>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-ton-blue to-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">HelpingHandsRewards</h1>
            <p className="text-sm text-blue-100">Telegram Mini-App</p>
          </div>
          {isTelegram && (
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Telegram
            </div>
          )}
        </div>

        {/* Wallet Status */}
        <div className="bg-white/10 rounded-lg p-3">
          {user?.tonWalletAddress ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100">Connected Wallet</p>
                <p className="font-mono text-sm">{shortenAddress(user.tonWalletAddress, 6)}</p>
              </div>
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="w-full bg-white text-ton-blue font-semibold py-2 px-4 rounded-lg text-sm"
            >
              Connect TON Wallet
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.personalReferrals}</p>
              <p className="text-xs text-blue-100">Referrals</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.matrixMembers}</p>
              <p className="text-xs text-blue-100">Matrix</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRewards, '')}</p>
              <p className="text-xs text-blue-100">Rewards</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex-1 py-3 text-sm font-semibold ${
              activeTab === 'levels'
                ? 'text-ton-blue border-b-2 border-ton-blue'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Levels
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-3 text-sm font-semibold ${
              activeTab === 'matrix'
                ? 'text-ton-blue border-b-2 border-ton-blue'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 text-sm font-semibold ${
              activeTab === 'rewards'
                ? 'text-ton-blue border-b-2 border-ton-blue'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Rewards
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Levels Tab */}
        {activeTab === 'levels' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Contribution Levels
            </h2>
            {levels.map((level) => {
              const active = isLevelActive(level.id)
              return (
                <div
                  key={level.id}
                  className={`rounded-lg p-4 ${
                    active
                      ? 'bg-ton-blue/10 border-2 border-ton-blue'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Level {level.level}
                        </span>
                        {active && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-ton-blue mt-1">
                        {level.amount} {level.currency}
                      </p>
                    </div>
                    <button
                      disabled={active}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                        active
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-ton-blue text-white hover:bg-blue-600'
                      }`}
                    >
                      {active ? 'Active' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <div>
            {userLevels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No active levels yet
                </p>
                <button
                  onClick={() => setActiveTab('levels')}
                  className="btn-primary"
                >
                  Activate a Level
                </button>
              </div>
            ) : (
              <>
                {/* Level Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Level
                  </label>
                  <select
                    value={selectedLevelId || ''}
                    onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    {userLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        Level {level.level} - {level.amount} {level.currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Compact Matrix View */}
                {matrixData && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                      Your 2×2 Matrix
                    </h3>
                    
                    {/* YOU */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-gradient-to-br from-ton-blue to-blue-600 text-white rounded-lg p-4 w-32 text-center relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-ton-blue text-white px-3 py-1 rounded-full text-xs font-bold">
                          YOU
                        </div>
                        <p className="font-bold text-sm mt-2">{user?.fullName}</p>
                        <p className="text-xs font-mono mt-1 opacity-90">{user?.memberCode}</p>
                      </div>
                    </div>

                    {/* Level 1 */}
                    <div className="flex justify-center gap-3 mb-6">
                      {matrixData.positions.filter(p => p.slotNumber <= 2).map((pos) => (
                        <MatrixNodeMobile key={pos.id} position={pos} />
                      ))}
                    </div>

                    {/* Level 2 */}
                    <div className="grid grid-cols-2 gap-2">
                      {matrixData.positions.filter(p => p.slotNumber >= 3 && p.slotNumber <= 6).map((pos) => (
                        <MatrixNodeMobile key={pos.id} position={pos} small />
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {matrixData.positions.filter(p => p.filledByUserId).length}/6
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Filled</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {matrixData.instance.cycleNumber}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Cycle</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Community Rewards
            </h2>
            {rewards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No rewards yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-ton-blue/10 text-ton-blue text-xs rounded-full font-semibold">
                        {reward.type}
                      </span>
                      <p className="text-lg font-bold text-ton-blue">
                        +{formatCurrency(reward.amount, reward.currency)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reward.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Mobile Matrix Node Component
function MatrixNodeMobile({ 
  position, 
  small = false 
}: { 
  position: any
  small?: boolean
}) {
  const isFilled = !!position.filledByUserId

  return (
    <div className={`rounded-lg border-2 ${small ? 'p-2' : 'p-3'} ${
      isFilled 
        ? 'bg-ton-blue/10 border-ton-blue' 
        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 border-dashed'
    }`}>
      {isFilled ? (
        <>
          <p className={`font-bold text-gray-900 dark:text-white ${small ? 'text-xs' : 'text-sm'} truncate`}>
            {position.filledByUser?.fullName || 'Member'}
          </p>
          <p className={`font-mono text-gray-600 dark:text-gray-400 ${small ? 'text-xs' : 'text-xs'}`}>
            {position.filledByUser?.memberCode}
          </p>
          <div className={`mt-1 ${small ? 'w-4 h-4' : 'w-5 h-5'} rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto`}>
            <svg className={`${small ? 'w-3 h-3' : 'w-3 h-3'} text-green-600 dark:text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </>
      ) : (
        <>
          <svg className={`${small ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 mx-auto`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className={`text-gray-500 text-center ${small ? 'text-xs' : 'text-xs'} mt-1`}>
            {getPositionLabel(position.slotNumber)}
          </p>
        </>
      )}
    </div>
  )
}
