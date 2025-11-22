import { useState, useEffect } from 'react'

interface AvatarProps {
  fitnessLevel: number
  weightLevel: number
  stressLevel: number
  happinessLevel: number
  bodyType: string
  gender: 'male' | 'female'
}

export default function Avatar3D({ fitnessLevel, weightLevel, stressLevel, happinessLevel }: AvatarProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading 3D Avatar...</p>
        </div>
      </div>
    )
  }

  // Simple 2D avatar representation for now
  const getBodySize = () => {
    const baseSize = 150
    const weightAdjustment = (weightLevel - 0.5) * 60
    return baseSize + weightAdjustment
  }

  const getFitnessColor = () => {
    if (fitnessLevel > 0.7) return 'bg-green-500'
    if (fitnessLevel > 0.4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHappinessEmoji = () => {
    if (happinessLevel > 0.7) return '😊'
    if (happinessLevel > 0.4) return '😐'
    return '😞'
  }

  const getStressColor = () => {
    const intensity = Math.round(stressLevel * 255)
    return `rgb(${intensity}, ${255 - intensity}, 0)`
  }

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
      
      {/* Avatar Container */}
      <div className="relative z-10 text-center">
        {/* Head */}
        <div className="mx-auto mb-4">
          <div 
            className="rounded-full bg-gradient-to-br from-yellow-200 to-yellow-300 mx-auto flex items-center justify-center text-4xl shadow-lg"
            style={{ 
              width: `${getBodySize() * 0.4}px`, 
              height: `${getBodySize() * 0.4}px`,
              border: `3px solid ${getStressColor()}`
            }}
          >
            {getHappinessEmoji()}
          </div>
        </div>

        {/* Body */}
        <div 
          className={`${getFitnessColor()} rounded-lg mx-auto shadow-lg transition-all duration-500`}
          style={{ 
            width: `${getBodySize()}px`, 
            height: `${getBodySize() * 1.2}px`,
            opacity: 0.8 + (fitnessLevel * 0.2)
          }}
        >
          {/* Fitness indicator */}
          <div className="h-full flex items-center justify-center">
            <div className="text-white font-bold text-lg">
              {fitnessLevel > 0.7 ? '💪' : fitnessLevel > 0.4 ? '✋' : '😴'}
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Fitness: {Math.round(fitnessLevel * 100)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Weight: {Math.round(weightLevel * 100)}%</span>
            </div>
          </div>
          <div className="flex justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Stress: {Math.round(stressLevel * 100)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Happiness: {Math.round(happinessLevel * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating indicators */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700">Financial Health</p>
        <p className="text-lg font-bold text-green-600">
          {Math.round(((fitnessLevel + happinessLevel - stressLevel) / 3) * 100)}%
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-4 left-4 bg-white/60 backdrop-blur-sm rounded-lg p-2">
        <p className="text-xs text-gray-600">Your spending shapes your avatar</p>
      </div>
    </div>
  )
}