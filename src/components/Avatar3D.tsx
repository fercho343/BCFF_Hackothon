import { useState, useEffect, useMemo } from 'react'

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
  const healthPercent = useMemo(() => {
    const v = ((fitnessLevel + happinessLevel - stressLevel) / 3) * 100
    return Math.max(0, Math.min(100, Math.round(v)))
  }, [fitnessLevel, happinessLevel, stressLevel])
  const isHealthy = healthPercent >= 50
  const bodyScale = useMemo(() => {
    const base = 1
    return base + (weightLevel - 0.5) * 0.6
  }, [weightLevel])
  const bodyColor = isHealthy ? '#10B981' : '#EF4444'
  const headBorder = useMemo(() => {
    const intensity = Math.round(stressLevel * 255)
    return `rgb(${intensity}, ${255 - intensity}, 0)`
  }, [stressLevel])

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

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700">Financial Health</p>
        <p className={isHealthy ? 'text-lg font-bold text-emerald-600' : 'text-lg font-bold text-red-600'}>{healthPercent}%</p>
      </div>
      <div className="absolute bottom-4 left-4 bg-white/60 backdrop-blur-sm rounded-lg p-2">
        <p className="text-xs text-gray-600">Your spending shapes your avatar</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '800px' }}>
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: isHealthy ? 'rotateX(10deg) translateZ(40px)' : 'rotateX(25deg) translateZ(10px)',
          }}
        >
          <div
            style={{
              width: `${0.35 * 150 * bodyScale}px`,
              height: `${0.35 * 150 * bodyScale}px`,
              borderRadius: '50%',
              background: '#fde68a',
              border: `3px solid ${headBorder}`,
              boxShadow: isHealthy ? '0 10px 20px rgba(16,185,129,0.3)' : '0 10px 20px rgba(239,68,68,0.3)',
              transform: 'translateZ(60px) translateY(-20px)'
            }}
          />
          <div
            style={{
              width: `${0.9 * bodyScale * 80}px`,
              height: `${1.6 * bodyScale * 80}px`,
              borderRadius: '12px',
              background: bodyColor,
              opacity: isHealthy ? 0.95 : 0.85,
              boxShadow: isHealthy ? '0 20px 40px rgba(16,185,129,0.25)' : '0 20px 40px rgba(239,68,68,0.25)',
              transform: isHealthy ? 'translateZ(40px)' : 'rotateZ(6deg) translateZ(20px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${0.09 * bodyScale * 80}px`,
              height: `${1.1 * bodyScale * 80}px`,
              left: `-${0.6 * bodyScale * 80}px`,
              top: '40px',
              borderRadius: '8px',
              background: bodyColor,
              transform: isHealthy ? 'rotateZ(6deg) translateZ(25px)' : 'rotateZ(35deg) translateZ(15px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${0.09 * bodyScale * 80}px`,
              height: `${1.1 * bodyScale * 80}px`,
              left: `${0.6 * bodyScale * 80}px`,
              top: '40px',
              borderRadius: '8px',
              background: bodyColor,
              transform: isHealthy ? 'rotateZ(-6deg) translateZ(25px)' : 'rotateZ(-35deg) translateZ(15px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${0.11 * bodyScale * 80}px`,
              height: `${1.4 * bodyScale * 80}px`,
              left: `-${0.25 * bodyScale * 80}px`,
              top: `${1.6 * bodyScale * 80}px`,
              borderRadius: '10px',
              background: isHealthy ? '#065f46' : '#7f1d1d',
              transform: 'translateZ(5px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${0.11 * bodyScale * 80}px`,
              height: `${1.4 * bodyScale * 80}px`,
              left: `${0.25 * bodyScale * 80}px`,
              top: `${1.6 * bodyScale * 80}px`,
              borderRadius: '10px',
              background: isHealthy ? '#065f46' : '#7f1d1d',
              transform: 'translateZ(5px)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
