export interface Transaction {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string
  transaction_date: string
  transaction_type: 'income' | 'expense'
  created_at: string
  category?: Category
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  color: string
  icon: string
  is_default: boolean
  monthly_budget: number
  created_at: string
}

export interface AvatarState {
  id: string
  user_id: string
  fitness_level: number
  weight_level: number
  stress_level: number
  happiness_level: number
  body_type: string
  appearance_data: Record<string, any>
  last_updated: string
}

export interface FinancialHealthScore {
  overall: number
  spending_habits: number
  savings_rate: number
  budget_adherence: number
  debt_management: number
}