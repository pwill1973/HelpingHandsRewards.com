import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { shortenAddress, formatCurrency } from '@shared/utils'
import type { DashboardStats, ContributionData, RewardData } from '@shared/types'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [tonConnectUI] = useTonConnectUI()
  const tonAddress = useTonAddress()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contributions, setContributions] = useState<ContributionData[]>([])
  const [rewards, setRewards] = useState<RewardData[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingWallet, setLinkingWallet] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    // Auto-link wallet when connected
    if (tonAddress && !user?.tonWalletAddress) {
      handleLinkWallet()
    }
  }, [tonAddress, user?.tonWalletAddress])

  const loadDashboardData = async () => {
    try {
      const [statsRes, contributionsRes, rewardsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getContributions(),
        api.getRewards()
      ])

      if (statsRes.success) setStats(statsRes.data!)
      if (contributionsRes.success) setContributions(contributionsRes.data!)
      if (rewardsRes.success) setRewards(rewardsRes.data!)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleLinkWallet = async () => {
    if (!tonAddress) return
    
    setLinkingWallet(true)
    try {
      await api.linkWallet({
        walletAddress: tonAddress,
        network: 'testnet' // TODO: Detect network from TON Connect
      })
      await refreshUser()
    } catch (error) {
      console.error('Failed to link wallet:', error)
    } finally {
      setLinkingWallet(false)
    }
  }

  const referralLink = user ? `${window.location.origin}/join?ref=${user.referralCode}` : ''

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ton-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dashboard
        </h1>

        {/* Profile Card */}
        <div className="card mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.fullName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Member Code: <span className="font-mono font-bold">{user?.memberCode}</span>
              </p>
              {user?.sponsor && (
                <p className="text-gray-600 dark:text-gray-400">
                  Sponsor: <span className="font-semibold">{user.sponsor.fullName}</span> ({user.sponsor.memberCode})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TON Wallet Card */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            TON Wallet Connection
          </h3>
          
          {user?.tonWalletAddress ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connected Wallet</p>
                <p className="font-mono text-lg text-gray-900 dark:text-white">
                  {shortenAddress(user.tonWalletAddress, 8)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Network: {user.tonNetwork}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your TON wallet to participate in on-chain contributions and rewards.
              </p>
              <button 
                onClick={handleConnectWallet}
                disabled={linkingWallet}
                className="btn-primary disabled:opacity-50"
              >
                {linkingWallet ? 'Linking...' : 'Connect TON Wallet'}
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Personal Referrals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.personalReferrals}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Matrix Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.matrixMembers}/6</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Downline</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDownline}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Community Rewards</p>
              <p className="text-3xl font-bold text-ton-blue">{formatCurrency(stats.totalRewards)}</p>
            </div>
          </div>
        )}

        {/* Referral Link */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Your Referral Link
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="input-field flex-1 font-mono text-sm"
            />
            <button onClick={copyReferralLink} className="btn-primary">
              Copy
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to="/matrix" className="card hover:shadow-xl transition-shadow cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              View Your Matrix
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See your 2×2 Community Matrix structure and team members
            </p>
          </Link>
          
          <div className="card opacity-50 cursor-not-allowed">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Make Contribution
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Coming soon: Contribute to the community via TON blockchain
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Contributions */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Contributions
            </h3>
            {contributions.length > 0 ? (
              <div className="space-y-2">
                {contributions.slice(0, 5).map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(contribution.amount, contribution.currency)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(contribution.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      contribution.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      contribution.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {contribution.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No contributions yet</p>
            )}
          </div>

          {/* Recent Rewards */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Community Rewards
            </h3>
            {rewards.length > 0 ? (
              <div className="space-y-2">
                {rewards.slice(0, 5).map((reward) => (
                  <div key={reward.id} className="py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-ton-blue">
                          +{formatCurrency(reward.amount, reward.currency)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{reward.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{new Date(reward.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No rewards yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
