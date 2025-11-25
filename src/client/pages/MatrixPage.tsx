import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { getPositionLabel } from '@shared/utils'
import type { MatrixView, MatrixPositionData } from '@shared/types'

export default function MatrixPage() {
  useAuth()
  const [matrix, setMatrix] = useState<MatrixView | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatrix()
  }, [])

  const loadMatrix = async () => {
    try {
      const response = await api.getMatrix()
      if (response.success) {
        setMatrix(response.data!)
      }
    } catch (error) {
      console.error('Failed to load matrix:', error)
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

  if (!matrix) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">Failed to load matrix</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your 2×2 Community Matrix
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your community structure with 2 positions on Level 1 and 4 positions on Level 2
          </p>
        </div>

        {/* Matrix Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <MatrixVisualization matrix={matrix} />
        </div>

        {/* Matrix Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Level 1 Filled
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {matrix.level1.filter(p => p.filledByUserId).length} / 2
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Level 2 Filled
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {matrix.level2.filter(p => p.filledByUserId).length} / 4
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Matrix Filled
            </h3>
            <p className="text-2xl font-bold text-ton-blue">
              {matrix.positions.filter(p => p.filledByUserId).length} / 6
            </p>
          </div>
        </div>

        {/* Position Details */}
        <div className="card mt-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Position Details
          </h3>
          <div className="space-y-4">
            {matrix.positions.map((position) => (
              <div 
                key={position.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    position.filledByUserId 
                      ? 'bg-ton-blue text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}>
                    {position.positionIndex}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getPositionLabel(position.positionIndex)}
                    </p>
                    {position.filledByUser ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {position.filledByUser.fullName}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {position.filledByUser.memberCode}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Available position</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    position.filledByUserId 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    {position.filledByUserId ? 'Active' : 'Empty'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Matrix Visualization Component
function MatrixVisualization({ matrix }: { matrix: MatrixView; currentUserId?: number }) {
  const level1 = matrix.level1.sort((a, b) => a.positionIndex - b.positionIndex)
  const level2 = matrix.level2.sort((a, b) => a.positionIndex - b.positionIndex)
  
  // Group level 2 positions by parent
  const level2Left = level2.filter(p => p.positionIndex <= 4)
  const level2Right = level2.filter(p => p.positionIndex > 4)

  return (
    <div className="flex flex-col items-center space-y-12">
      {/* YOU (Owner) */}
      <div>
        <MatrixNode 
          position={null}
          isOwner={true}
          name={matrix.owner.fullName}
          memberCode={matrix.owner.memberCode}
        />
      </div>

      {/* Connection Line from YOU to Level 1 */}
      <div className="relative w-full max-w-2xl h-16">
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 dark:bg-gray-600 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
      </div>

      {/* Level 1 */}
      <div className="flex justify-center gap-24">
        {level1.map((position, idx) => (
          <div key={position.id} className="flex flex-col items-center">
            <MatrixNode position={position} />
            <p className="text-xs text-gray-500 mt-2">{getPositionLabel(position.positionIndex)}</p>
            
            {/* Connection line to Level 2 */}
            <div className="relative w-48 h-16 mt-4">
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 dark:bg-gray-600 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Level 2 under this Level 1 position */}
            <div className="flex gap-8 mt-4">
              {(idx === 0 ? level2Left : level2Right).map((l2Pos) => (
                <div key={l2Pos.id} className="flex flex-col items-center">
                  <MatrixNode position={l2Pos} isSmall={true} />
                  <p className="text-xs text-gray-500 mt-1">{getPositionLabel(l2Pos.positionIndex)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Matrix Node Component
function MatrixNode({ 
  position, 
  isOwner = false, 
  isSmall = false,
  name,
  memberCode
}: { 
  position: MatrixPositionData | null
  isOwner?: boolean
  isSmall?: boolean
  name?: string
  memberCode?: string
}) {
  const isFilled = isOwner || (position?.filledByUserId)
  const displayName = isOwner ? name : position?.filledByUser?.fullName
  const displayCode = isOwner ? memberCode : position?.filledByUser?.memberCode

  return (
    <div className={`
      matrix-node
      ${isOwner ? 'matrix-node you' : isFilled ? 'matrix-node filled' : 'matrix-node empty'}
      ${isSmall ? 'w-32 h-24' : 'w-40 h-32'}
      ${!isFilled && 'hover:border-ton-blue hover:bg-ton-blue/5'}
    `}>
      {isOwner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ton-blue text-white px-3 py-1 rounded-full text-xs font-bold">
          YOU
        </div>
      )}
      
      {isFilled ? (
        <>
          <p className={`font-bold text-center ${isOwner ? 'text-white' : 'text-gray-900 dark:text-white'} ${isSmall ? 'text-sm' : 'text-base'}`}>
            {displayName}
          </p>
          <p className={`font-mono ${isOwner ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'} ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {displayCode}
          </p>
          <div className={`mt-2 ${isSmall ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isOwner ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900'} flex items-center justify-center mx-auto`}>
            <svg className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} ${isOwner ? 'text-white' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </>
      ) : (
        <>
          <svg className={`${isSmall ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className={`text-gray-500 text-center ${isSmall ? 'text-xs' : 'text-sm'}`}>Available</p>
        </>
      )}
    </div>
  )
}
