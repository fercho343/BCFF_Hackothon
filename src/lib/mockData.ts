// Mock data for development without Supabase
export const mockUser = {
  id: 'mock-user-id',
  email: 'demo@financialavatar.com',
  full_name: 'Demo User'
}

export const mockAvatarState = {
  id: 'mock-avatar-id',
  user_id: 'mock-user-id',
  fitness_level: 0.6,
  weight_level: 0.4,
  stress_level: 0.3,
  happiness_level: 0.8,
  body_type: 'fit',
  appearance_data: {},
  last_updated: new Date().toISOString()
}

export const mockCategories = [
  { id: '1', user_id: null, name: 'Food & Dining', color: '#EF4444', icon: 'utensils', is_default: true, monthly_budget: 500, created_at: new Date().toISOString() },
  { id: '2', user_id: null, name: 'Exercise & Fitness', color: '#10B981', icon: 'dumbbell', is_default: true, monthly_budget: 200, created_at: new Date().toISOString() },
  { id: '3', user_id: null, name: 'Entertainment', color: '#F59E0B', icon: 'film', is_default: true, monthly_budget: 300, created_at: new Date().toISOString() }
]

export const mockTransactions = [
  {
    id: '1',
    user_id: 'mock-user-id',
    category_id: '1',
    amount: 45.50,
    description: 'Lunch at Healthy Cafe',
    transaction_date: new Date().toISOString(),
    transaction_type: 'expense' as const,
    created_at: new Date().toISOString(),
    category: mockCategories[0]
  },
  {
    id: '2',
    user_id: 'mock-user-id',
    category_id: '2',
    amount: 50.00,
    description: 'Gym Membership',
    transaction_date: new Date(Date.now() - 86400000).toISOString(),
    transaction_type: 'expense' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    category: mockCategories[1]
  }
]