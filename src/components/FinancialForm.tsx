import { useState } from 'react'
import { FinancialData } from '@/utils/financialHealth'

interface FinancialFormProps {
  onSubmit: (data: FinancialData) => void
  loading?: boolean
}

export default function FinancialForm({ onSubmit, loading }: FinancialFormProps) {
  const [formData, setFormData] = useState<FinancialData>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    debt: 0,
    investments: 0,
    financialGoals: 'moderate'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof FinancialData, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Income
          </label>
          <input
            type="number"
            value={formData.monthlyIncome}
            onChange={(e) => handleInputChange('monthlyIncome', Number(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your monthly income"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Expenses
          </label>
          <input
            type="number"
            value={formData.monthlyExpenses}
            onChange={(e) => handleInputChange('monthlyExpenses', Number(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your monthly expenses"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Savings
          </label>
          <input
            type="number"
            value={formData.savings}
            onChange={(e) => handleInputChange('savings', Number(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your current savings"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Debt
          </label>
          <input
            type="number"
            value={formData.debt}
            onChange={(e) => handleInputChange('debt', Number(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your total debt"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investments
          </label>
          <input
            type="number"
            value={formData.investments}
            onChange={(e) => handleInputChange('investments', Number(e.target.value))}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your total investments"
            min="0"
            step="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Goals
          </label>
          <select
            value={formData.financialGoals}
            onChange={(e) => handleInputChange('financialGoals', e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="conservative">Conservative (Low Risk)</option>
            <option value="moderate">Moderate (Balanced)</option>
            <option value="aggressive">Aggressive (High Risk/Reward)</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Savings Rate:</span> {formData.monthlyIncome > 0 ? `${((formData.savings / formData.monthlyIncome) * 100).toFixed(1)}%` : '0%'}
          </div>
          <div>
            <span className="font-medium">Debt-to-Income:</span> {formData.monthlyIncome > 0 ? `${((formData.debt / formData.monthlyIncome) * 100).toFixed(1)}%` : '0%'}
          </div>
          <div>
            <span className="font-medium">Expense Ratio:</span> {formData.monthlyIncome > 0 ? `${((formData.monthlyExpenses / formData.monthlyIncome) * 100).toFixed(1)}%` : '0%'}
          </div>
          <div>
            <span className="font-medium">Investment Rate:</span> {formData.monthlyIncome > 0 ? `${((formData.investments / formData.monthlyIncome) * 100).toFixed(1)}%` : '0%'}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium disabled:opacity-50 hover:from-purple-700 hover:to-blue-700 transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze Financial Health'}
      </button>
    </form>
  )
}