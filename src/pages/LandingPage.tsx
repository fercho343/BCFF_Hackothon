import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { User, Lock, Mail, Eye, EyeOff, LogOut } from 'lucide-react'
import Avatar3D from '@/components/Avatar3D'
import { mockUser } from '@/lib/mockData'

export default function LandingPage() {
  const navigate = useNavigate()
  const { setUser, user, isAuthenticated } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const isConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key')

      if (!isConfigured) {
        // Mock authentication for development
        setUser({
          id: mockUser.id,
          email: formData.email,
          full_name: isLogin ? formData.email.split('@')[0] : formData.fullName
        })
        
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!')
        navigate('/dashboard')
        return
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error

        setUser({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || data.user.email!
        })
        
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            }
          }
        })

        if (error) throw error

        setUser({
          id: data.user.id,
          email: data.user.email!,
          full_name: formData.fullName
        })
        
        toast.success('Account created successfully!')
        navigate('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Show loading state while checking authentication
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-emerald-50">
      {/* Header with logout button (if somehow user ends up here while authenticated) */}
      {isAuthenticated && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg text-purple-600 hover:bg-white transition-colors"
          >
            <span>Go to Dashboard</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Financial Avatar
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Watch your financial health come to life with our interactive 3D avatar
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 3D Avatar Demo */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <Avatar3D
                fitnessLevel={0.6}
                weightLevel={0.4}
                stressLevel={0.3}
                happinessLevel={0.8}
                bodyType="fit"
                gender="male"
              />
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">Your spending shapes your avatar</p>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600">
                  {isLogin ? 'Sign in to your financial journey' : 'Start your financial transformation'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-gray-800">Track Spending</h3>
                <p className="text-sm text-gray-600">Categorize and monitor expenses</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium text-gray-800">Set Goals</h3>
                <p className="text-sm text-gray-600">Achieve financial wellness</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
