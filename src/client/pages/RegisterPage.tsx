import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const CONTRIBUTION_LEVELS = [
  { id: 1, amount: 5, description: 'Entry door into the community' },
  { id: 2, amount: 10, description: 'Builds on your first Contribution' },
  { id: 3, amount: 20, description: 'Expands your 2×2 Community Matrix' },
  { id: 4, amount: 40, description: 'Higher-level community support' },
  { id: 5, amount: 80, description: 'Deeper participation' },
  { id: 6, amount: 160, description: 'Advanced level' },
  { id: 7, amount: 320, description: 'Growing Community Rewards' },
  { id: 8, amount: 640, description: 'High-activity community segment' },
  { id: 9, amount: 1280, description: 'Upper tier support' },
  { id: 10, amount: 2560, description: 'Full HelpingHandsRewards journey' }
]

export default function RegisterPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref') || ''

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    referralCode: referralCode,
    selectedLevels: [1] as number[]
  })
  const [showLevelSelector, setShowLevelSelector] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  
  const { register, authenticateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (referralCode) {
      setFormData(prev => ({ ...prev, referralCode }))
    }
  }, [referralCode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Modern auth flow (generic button)
  const handleJoinCommunity = async () => {
    setError('')
    setAuthLoading(true)

    try {
      await authenticateUser()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || t.register.authenticationFailed)
    } finally {
      setAuthLoading(false)
    }
  }

  // Legacy registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t.register.passwordMismatch)
      return
    }

    if (formData.password.length < 8) {
      setError(t.register.passwordTooShort)
      return
    }

    setLoading(true)

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        country: formData.country || undefined,
        referralCode: formData.referralCode || undefined,
        selectedLevels: formData.selectedLevels
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || t.register.registrationFailed)
    } finally {
      setLoading(false)
    }
  }

  const toggleLevel = (levelId: number) => {
    setFormData(prev => {
      const levels = prev.selectedLevels.includes(levelId)
        ? prev.selectedLevels.filter(id => id !== levelId)
        : [...prev.selectedLevels, levelId].sort((a, b) => a - b)
      
      return { ...prev, selectedLevels: levels.length > 0 ? levels : [1] }
    })
  }

  const selectAllLevels = () => {
    setFormData(prev => ({ ...prev, selectedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }))
  }

  const deselectAllLevels = () => {
    setFormData(prev => ({ ...prev, selectedLevels: [1] }))
  }

  const totalContribution = formData.selectedLevels.reduce((sum, levelId) => {
    const level = CONTRIBUTION_LEVELS.find(l => l.id === levelId)
    return sum + (level?.amount || 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.register.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t.register.subtitle}
          </p>
        </div>

        {/* Contribution Levels Explanation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t.register.contributionLevelsTitle}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {t.register.contributionLevelsSubtitle}
          </p>

          {/* Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {CONTRIBUTION_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => toggleLevel(level.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.selectedLevels.includes(level.id)
                    ? 'border-ton-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-ton-blue'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    {t.common.level} {level.id}
                  </span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    formData.selectedLevels.includes(level.id)
                      ? 'border-ton-blue bg-ton-blue'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.selectedLevels.includes(level.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-ton-blue mb-1">
                  {level.amount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.common.usdt_ton}
                </div>
              </button>
            ))}
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={selectAllLevels}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm font-medium"
            >
              {t.register.selectAllLevels}
            </button>
            <button
              type="button"
              onClick={deselectAllLevels}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm font-medium"
            >
              {t.register.deselectAll}
            </button>
          </div>

          {/* Total */}
          <div className="bg-ton-blue/10 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {t.register.totalContribution}
                </div>
                <div className="text-3xl font-bold text-ton-blue">
                  {totalContribution} {t.common.usdt_ton}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t.register.selectedLevels}: {formData.selectedLevels.length}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Upgrade Explanation */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t.register.autoUpgradeTitle}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {t.register.autoUpgradeDescription}
          </p>
        </div>

        {/* Duplication Philosophy */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t.register.duplicationTitle}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {t.register.duplicationDescription}
          </p>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {t.register.duplicationDisclaimer}
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Modern auth button - Generic wording only */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleJoinCommunity}
              disabled={authLoading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? t.common.pleaseWait : t.register.modernAuthButton}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                {t.register.orRegisterWith}
              </span>
            </div>
          </div>

          {/* Legacy registration form */}
          <form className="space-y-6" onSubmit={handleSubmit}>

            {referralCode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg">
                {t.register.withReferralCode} <strong>{referralCode}</strong>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="label">
                  {t.register.fullName}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  {t.register.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  {t.register.password}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">{t.register.passwordHint}</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  {t.register.confirmPassword}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="country" className="label">
                  {t.register.country}
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="United States"
                />
              </div>

              {!referralCode && (
                <div>
                  <label htmlFor="referralCode" className="label">
                    {t.register.referralCode}
                  </label>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={t.register.referralCodePlaceholder}
                  />
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.register.creatingAccount : t.register.createAccount}
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {t.register.termsAgree}
            </p>
          </form>

          {/* Link to login */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.register.alreadyHaveAccount}{' '}
              <Link to="/login" className="font-medium text-ton-blue hover:text-blue-600">
                {t.register.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
