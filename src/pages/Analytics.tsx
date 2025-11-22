import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import type { Transaction, Category } from '@/types'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

export default function Analytics() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      setLoading(true)
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .select(`*, category:categories(*)`)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: true })
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
      if (!txErr && tx) setTransactions(tx as any)
      if (!catErr && cats) setCategories(cats as any)
      setLoading(false)
    }
    run()
  }, [user?.id])

  const now = useMemo(() => new Date(), [])
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
  const lastMonths = useMemo(() => {
    const arr: Date[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      d.setDate(1)
      arr.push(d)
    }
    return arr
  }, [now])

  const txByMonth = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {}
    transactions.forEach(t => {
      const d = new Date(t.transaction_date)
      const k = monthKey(d)
      if (!map[k]) map[k] = { income: 0, expense: 0 }
      if (t.transaction_type === 'income') map[k].income += Number(t.amount)
      else map[k].expense += Number(t.amount)
    })
    return map
  }, [transactions])

  const lineData = useMemo(() => {
    const labels = lastMonths.map(monthLabel)
    const income = lastMonths.map(d => txByMonth[monthKey(d)]?.income || 0)
    const expense = lastMonths.map(d => txByMonth[monthKey(d)]?.expense || 0)
    return {
      labels,
      datasets: [
        { label: 'Income', data: income, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.2)', tension: 0.3 },
        { label: 'Expense', data: expense, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)', tension: 0.3 }
      ]
    }
  }, [lastMonths, txByMonth])

  const currentMonth = useMemo(() => {
    const d = new Date(now)
    d.setDate(1)
    return d
  }, [now])

  const currentMonthTotals = useMemo(() => {
    const key = monthKey(currentMonth)
    const income = txByMonth[key]?.income || 0
    const expense = txByMonth[key]?.expense || 0
    const savings = Math.max(income - expense, 0)
    const rate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
    return { income, expense, savings, rate }
  }, [txByMonth, currentMonth])

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>()
    categories.forEach(c => m.set(c.id, c))
    return m
  }, [categories])

  const currentMonthExpensesByCategory = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach(t => {
      const d = new Date(t.transaction_date)
      if (t.transaction_type !== 'expense') return
      if (d.getFullYear() !== currentMonth.getFullYear() || d.getMonth() !== currentMonth.getMonth()) return
      const name = t.category?.name || categoryMap.get(t.category_id)?.name || 'Uncategorized'
      map.set(name, (map.get(name) || 0) + Number(t.amount))
    })
    const labels = Array.from(map.keys())
    const data = Array.from(map.values())
    const colors = labels.map((l) => {
      const cat = categories.find(c => c.name === l)
      return cat?.color || '#3B82F6'
    })
    return { labels, data, colors }
  }, [transactions, currentMonth, categoryMap, categories])

  const budgetVsActual = useMemo(() => {
    const cats = categories.filter(c => Number(c.monthly_budget) > 0)
    const labels = cats.map(c => c.name)
    const budget = cats.map(c => Number(c.monthly_budget))
    const actual = cats.map(c => {
      let sum = 0
      transactions.forEach(t => {
        const d = new Date(t.transaction_date)
        if (t.transaction_type !== 'expense') return
        if (d.getFullYear() !== currentMonth.getFullYear() || d.getMonth() !== currentMonth.getMonth()) return
        if (t.category_id === c.id) sum += Number(t.amount)
      })
      return sum
    })
    return { labels, budget, actual }
  }, [categories, transactions, currentMonth])

  const topCategory = useMemo(() => {
    let top = { name: '', amount: 0 }
    currentMonthExpensesByCategory.labels.forEach((l, i) => {
      const amt = currentMonthExpensesByCategory.data[i]
      if (amt > top.amount) top = { name: l, amount: amt }
    })
    return top
  }, [currentMonthExpensesByCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="text-sm text-gray-500">Income (This Month)</div>
            <div className="text-2xl font-bold text-emerald-600">${currentMonthTotals.income.toFixed(2)}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="text-sm text-gray-500">Expense (This Month)</div>
            <div className="text-2xl font-bold text-red-600">${currentMonthTotals.expense.toFixed(2)}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="text-sm text-gray-500">Savings (This Month)</div>
            <div className="text-2xl font-bold text-blue-600">${currentMonthTotals.savings.toFixed(2)}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="text-sm text-gray-500">Savings Rate</div>
            <div className="text-2xl font-bold text-purple-600">{currentMonthTotals.rate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Income vs Expense (6 Months)</h2>
            </div>
            <Line
              data={lineData}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Expense by Category (This Month)</h2>
              <div className="text-sm text-gray-500">Top: {topCategory.name || '—'}</div>
            </div>
            <Doughnut
              data={{
                labels: currentMonthExpensesByCategory.labels,
                datasets: [
                  {
                    data: currentMonthExpensesByCategory.data,
                    backgroundColor: currentMonthExpensesByCategory.colors,
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Budget vs Actual (This Month)</h2>
            </div>
            <Bar
              data={{
                labels: budgetVsActual.labels,
                datasets: [
                  { label: 'Budget', data: budgetVsActual.budget, backgroundColor: 'rgba(59,130,246,0.4)' },
                  { label: 'Actual', data: budgetVsActual.actual, backgroundColor: 'rgba(239,68,68,0.4)' }
                ]
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-center text-gray-500">Loading data…</div>
        )}
        {!loading && transactions.length === 0 && (
          <div className="mt-6 text-center text-gray-500">No transactions found</div>
        )}
      </div>
    </div>
  )
}
