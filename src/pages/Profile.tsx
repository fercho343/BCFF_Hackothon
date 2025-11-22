import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import Avatar3D from '@/components/Avatar3D'
import { toast } from 'sonner'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [fitnessLevel, setFitnessLevel] = useState(0.5)
  const [weightLevel, setWeightLevel] = useState(0.5)
  const [stressLevel, setStressLevel] = useState(0.5)
  const [happinessLevel, setHappinessLevel] = useState(0.5)
  const [bodyType, setBodyType] = useState('average')
  const [gender, setGender] = useState<'male' | 'female'>('male')

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      setLoading(true)
      const { data } = await supabase
        .from('avatar_states')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setFitnessLevel(Number(data.fitness_level ?? 0.5))
        setWeightLevel(Number(data.weight_level ?? 0.5))
        setStressLevel(Number(data.stress_level ?? 0.5))
        setHappinessLevel(Number(data.happiness_level ?? 0.5))
        setBodyType(String(data.body_type ?? 'average'))
      }
      setLoading(false)
    }
    run()
  }, [user?.id])

  const saveProfile = async () => {
    if (!user?.id) return
    setLoading(true)
    const { error: userErr } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    if (!userErr) {
      setUser({ id: user.id, email: user.email, full_name: fullName })
    }
    const payload = {
      user_id: user.id,
      fitness_level: Number(fitnessLevel),
      weight_level: Number(weightLevel),
      stress_level: Number(stressLevel),
      happiness_level: Number(happinessLevel),
      body_type: bodyType,
      appearance_data: {}
    }
    const { error: avatarErr } = await supabase
      .from('avatar_states')
      .upsert(payload, { onConflict: 'user_id' })
    if (userErr || avatarErr) {
      toast.error(userErr?.message || avatarErr?.message || 'Failed to save')
    } else {
      toast.success('Profile saved')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input value={user?.email || ''} readOnly className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Avatar Preview</h2>
            <Avatar3D
              fitnessLevel={fitnessLevel}
              weightLevel={weightLevel}
              stressLevel={stressLevel}
              happinessLevel={happinessLevel}
              bodyType={bodyType}
              gender={gender}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fitness</h2>
            <input type="range" min="0" max="1" step="0.01" value={fitnessLevel} onChange={(e) => setFitnessLevel(parseFloat(e.target.value))} className="w-full" />
            <div className="mt-2 text-sm text-gray-600">{Math.round(fitnessLevel * 100)}%</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weight</h2>
            <input type="range" min="0" max="1" step="0.01" value={weightLevel} onChange={(e) => setWeightLevel(parseFloat(e.target.value))} className="w-full" />
            <div className="mt-2 text-sm text-gray-600">{Math.round(weightLevel * 100)}%</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Stress</h2>
            <input type="range" min="0" max="1" step="0.01" value={stressLevel} onChange={(e) => setStressLevel(parseFloat(e.target.value))} className="w-full" />
            <div className="mt-2 text-sm text-gray-600">{Math.round(stressLevel * 100)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Happiness</h2>
            <input type="range" min="0" max="1" step="0.01" value={happinessLevel} onChange={(e) => setHappinessLevel(parseFloat(e.target.value))} className="w-full" />
            <div className="mt-2 text-sm text-gray-600">{Math.round(happinessLevel * 100)}%</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Body Type</h2>
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="average">Average</option>
              <option value="fit">Fit</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gender</h2>
            <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button onClick={saveProfile} disabled={loading} className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium disabled:opacity-50">Save Changes</button>
          {loading && <span className="text-gray-600">Saving…</span>}
        </div>
      </div>
    </div>
  )
}
