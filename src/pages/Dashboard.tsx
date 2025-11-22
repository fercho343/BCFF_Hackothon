import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import '@/lib/chart'
import { Transaction, AvatarState, Category } from '@/types'
import { Plus, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockAvatarState, mockCategories, mockTransactions } from '@/lib/mockData'
import { Doughnut } from 'react-chartjs-2'
import AvatarHuman3D from '@/components/AvatarHuman3D'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      if (!isConfigured) {
        // Use mock data for development
        setAvatarState(mockAvatarState)
        setRecentTransactions(mockTransactions)
        setCategories(mockCategories)
        setLoading(false)
        return
      }

      // Fetch avatar state
      const { data: avatarData } = await supabase
        .from('avatar_states')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (avatarData) {
        setAvatarState(avatarData)
      }

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false })
        .limit(5)

      if (transactionsData) {
        setRecentTransactions(transactionsData)
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user?.id},is_default.eq.true`)

      if (categoriesData) {
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to mock data on error
      setAvatarState(mockAvatarState)
      setRecentTransactions(mockTransactions)
      setCategories(mockCategories)
    } finally {
      setLoading(false)
    }
  }

  const getTotalSpending = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return recentTransactions
      .filter(t => {
        const transactionDate = new Date(t.transaction_date)
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               t.transaction_type === 'expense'
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getFinancialHealthScore = () => {
    if (!avatarState) return 0
    return Math.round(
      (avatarState.fitness_level + avatarState.happiness_level - avatarState.stress_level) * 100 / 3
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial avatar...</p>
        </div>
        {/* Spending Overview */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <SpendingOverview transactions={recentTransactions} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Financial Avatar</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.full_name}</span>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700"
              >
                {user?.full_name?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Financial Avatar</h2>
              {avatarState && (
                <AvatarHuman3D
                  fitnessLevel={avatarState.fitness_level}
                  weightLevel={avatarState.weight_level}
                  stressLevel={avatarState.stress_level}
                  happinessLevel={avatarState.happiness_level}
                  bodyType={avatarState.body_type}
                  gender={gender}
                />
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Gender</span>
                  <div className="inline-flex rounded-lg overflow-hidden border">
                    <button
                      className={`px-3 py-1 text-sm ${gender === 'male' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
                      onClick={() => setGender('male')}
                    >
                      Male
                    </button>
                    <button
                      className={`px-3 py-1 text-sm ${gender === 'female' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
                      onClick={() => setGender('female')}
                    >
                      Female
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${Math.round(((avatarState?.fitness_level ?? 0) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Fitness</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {getFinancialHealthScore()}%
                  </div>
                  <div className="text-sm text-gray-600">Financial Health</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${getTotalSpending().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">This Month</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round((avatarState?.stress_level || 0) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Stress</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round((avatarState?.happiness_level || 0) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Happiness</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Transaction</span>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.transaction_type === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center space-y-1 text-purple-600"
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs">Transactions</span>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Analytics</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <Target className="h-6 w-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

function SpendingOverview({ transactions }: { transactions: Transaction[] }) {
  const categoryTotals = transactions.reduce<Record<string, number>>((acc, t) => {
    const key = t.category?.name || 'Uncategorized'
    acc[key] = (acc[key] || 0) + (t.transaction_type === 'expense' ? t.amount : 0)
    return acc
  }, {})

  const topEntries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const data = {
    labels: topEntries.map(([name]) => name),
    datasets: [
      {
        data: topEntries.map(([, total]) => total),
        backgroundColor: ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4']
      }
    ]
  }

  return (
    <div className="md:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Spending Categories</h3>
      {topEntries.length === 0 ? (
        <p className="text-gray-500 text-sm">No data available</p>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-64 h-64">
            <Doughnut data={data} />
          </div>
        </div>
      )}
    </div>
  )
}
