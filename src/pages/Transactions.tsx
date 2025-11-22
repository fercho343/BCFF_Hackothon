import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Transaction, Category } from '@/types'
import { Plus, Search, Edit, Trash2, Filter, Download, Upload, Calendar, DollarSign, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { mockCategories, mockTransactions } from '@/lib/mockData'

export default function Transactions() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    transaction_type: 'expense' as 'income' | 'expense',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#BF94E4',
    icon: 'tag',
    monthly_budget: 0
  })

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [])

  const fetchTransactions = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      if (!isConfigured) {
        // Use mock data for development
        setTransactions(mockTransactions)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
      // Fallback to mock data
      setTransactions(mockTransactions)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      if (!isConfigured) {
        setCategories(mockCategories)
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user?.id},is_default.eq.true`)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
      setCategories(mockCategories)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      const newTransaction = {
        user_id: user?.id || 'mock-user-id',
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id,
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        created_at: new Date().toISOString()
      }

      if (isConfigured) {
        const { error } = await supabase
          .from('transactions')
          .insert([newTransaction])

        if (error) throw error
      }

      // Add to local state
      const category = categories.find(c => c.id === formData.category_id)
      const transactionWithCategory = {
        ...newTransaction,
        id: Date.now().toString(),
        category
      }

      setTransactions(prev => [transactionWithCategory, ...prev])
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        transaction_type: 'expense',
        transaction_date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
      
      toast.success('Transaction added successfully!')
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingTransaction) return

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      const updatedTransaction = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id,
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date
      }

      if (isConfigured) {
        const { error } = await supabase
          .from('transactions')
          .update(updatedTransaction)
          .eq('id', editingTransaction.id)

        if (error) throw error
      }

      // Update local state
      const category = categories.find(c => c.id === formData.category_id)
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...t, ...updatedTransaction, category }
          : t
      ))

      setEditingTransaction(null)
      setShowAddForm(false)
      
      toast.success('Transaction updated successfully!')
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      if (isConfigured) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)

        if (error) throw error
      }

      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transaction deleted successfully!')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

      const newCategory = {
        user_id: user?.id,
        name: categoryFormData.name,
        color: categoryFormData.color,
        icon: categoryFormData.icon,
        monthly_budget: categoryFormData.monthly_budget,
        is_default: false,
        created_at: new Date().toISOString()
      }

      if (isConfigured) {
        const { error } = await supabase
          .from('categories')
          .insert([newCategory])

        if (error) throw error
      }

      // Add to local state
      const categoryWithId = {
        ...newCategory,
        id: Date.now().toString()
      }

      setCategories(prev => [...prev, categoryWithId])
      
      // Reset form
      setCategoryFormData({
        name: '',
        color: '#BF94E4',
        icon: 'tag',
        monthly_budget: 0
      })
      setShowCategoryForm(false)
      
      toast.success('Category added successfully!')
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    }
  }

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category_id: transaction.category_id,
      transaction_type: transaction.transaction_type,
      transaction_date: transaction.transaction_date.split('T')[0]
    })
    setShowAddForm(true)
  }

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...filteredTransactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.description,
        t.category?.name || 'Uncategorized',
        t.transaction_type,
        t.amount.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Transactions exported successfully!')
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || transaction.category_id === filterCategory
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    
    return matchesSearch && matchesCategory && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportTransactions}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Tag className="h-4 w-4" />
                <span>Category</span>
              </button>
              <button
                onClick={() => {
                  setEditingTransaction(null)
                  setFormData({
                    amount: '',
                    description: '',
                    category_id: '',
                    transaction_type: 'expense',
                    transaction_date: new Date().toISOString().split('T')[0]
                  })
                  setShowAddForm(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No transactions found</p>
                <p className="text-sm text-gray-400">Add your first transaction to get started</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: transaction.category?.color || '#gray' }}
                      >
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{transaction.category?.name || 'Uncategorized'}</span>
                          <span>•</span>
                          <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-semibold text-lg ${
                          transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{transaction.transaction_type}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEdit(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
            </div>
            
            <form onSubmit={editingTransaction ? handleUpdate : handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'expense' }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.transaction_type === 'expense' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'income' }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.transaction_type === 'income' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="What did you spend on?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Manage Categories</h3>
            </div>
            
            <div className="p-6">
              {/* Add new category form */}
              <form onSubmit={handleCategorySubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">Add New Category</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget</label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryFormData.monthly_budget}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, monthly_budget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Category
                </button>
              </form>

              {/* Existing categories */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Your Categories</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-800">{category.name}</span>
                        {category.is_default && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        ${category.monthly_budget.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}