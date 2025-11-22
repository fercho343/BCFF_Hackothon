import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useState, useEffect, useMemo } from 'react'

interface AvatarProps {
  fitnessLevel: number
  weightLevel: number
  stressLevel: number
  happinessLevel: number
  bodyType: string
  gender: 'male' | 'female'
}

function Human({ fitnessLevel, weightLevel, stressLevel, happinessLevel, gender }: AvatarProps) {
  const torsoRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (torsoRef.current) torsoRef.current.rotation.y = Math.sin(t * 0.3) * 0.1
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5) * 0.05
  })

  const baseTorsoWidth = gender === 'male' ? 0.8 : 0.7
  const baseTorsoHeight = 1.6
  const baseTorsoDepth = 0.5
  const weightScale = 1 + (weightLevel - 0.5) * 0.5
  const muscleScale = 0.9 + fitnessLevel * 0.3
  const stressTint = new THREE.Color(`hsl(${Math.min(60, stressLevel * 120)}, 60%, 60%)`)
  const happyTint = new THREE.Color(`hsl(${120 + happinessLevel * 60}, 60%, 60%)`)
  const bodyColor = stressLevel > 0.6 ? stressTint : happyTint

  return (
    <group>
      <mesh ref={torsoRef} position={[0, 0.2, 0]}> 
        <boxGeometry args={[baseTorsoWidth * weightScale, baseTorsoHeight * muscleScale, baseTorsoDepth * weightScale]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh ref={headRef} position={[0, baseTorsoHeight * muscleScale * 0.7 + 0.4, 0]}> 
        <sphereGeometry args={[0.35]} />
        <meshStandardMaterial color={happyTint} />
      </mesh>

      <mesh position={[-(baseTorsoWidth * weightScale) / 2 - 0.15, 0.4, 0]}> 
        <cylinderGeometry args={[0.12 * muscleScale, 0.1 * muscleScale, 1.0 * muscleScale, 12]} />
        <meshStandardMaterial color={'#DEB887'} />
      </mesh>
      <mesh position={[ (baseTorsoWidth * weightScale) / 2 + 0.15, 0.4, 0]}> 
        <cylinderGeometry args={[0.12 * muscleScale, 0.1 * muscleScale, 1.0 * muscleScale, 12]} />
        <meshStandardMaterial color={'#DEB887'} />
      </mesh>

      <mesh position={[-0.25, -1.0, 0]}> 
        <cylinderGeometry args={[0.14 * muscleScale, 0.12 * muscleScale, 1.3, 12]} />
        <meshStandardMaterial color={'#8B4513'} />
      </mesh>
      <mesh position={[0.25, -1.0, 0]}> 
        <cylinderGeometry args={[0.14 * muscleScale, 0.12 * muscleScale, 1.3, 12]} />
        <meshStandardMaterial color={'#8B4513'} />
      </mesh>

      <mesh position={[0, baseTorsoHeight * muscleScale * 0.7 + 0.75, 0]}> 
        <coneGeometry args={[0.2, 0.3, 12]} />
        <meshStandardMaterial color={fitnessLevel > 0.6 ? '#2c3e50' : '#9aa0a6'} />
      </mesh>
    </group>
  )
}

export default function Avatar3D({ fitnessLevel, weightLevel, stressLevel, happinessLevel, bodyType, gender }: AvatarProps) {
  const [isClient, setIsClient] = useState(false)
  const healthPercent = useMemo(() => {
    const v = ((fitnessLevel + happinessLevel - stressLevel) / 3) * 100
    return Math.max(0, Math.min(100, Math.round(v)))
  }, [fitnessLevel, happinessLevel, stressLevel])

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
        <p className={healthPercent >= 50 ? 'text-lg font-bold text-emerald-600' : 'text-lg font-bold text-red-600'}>{healthPercent}%</p>
      </div>
      <div className="absolute bottom-4 left-4 bg-white/60 backdrop-blur-sm rounded-lg p-2">
        <p className="text-xs text-gray-600">Your spending shapes your avatar</p>
      </div>
      <Canvas camera={{ position: [0, 1.2, 4], fov: 55 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        <Human fitnessLevel={fitnessLevel} weightLevel={weightLevel} stressLevel={stressLevel} happinessLevel={happinessLevel} bodyType={bodyType} gender={gender} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
      </Canvas>
    </div>
  )
}
