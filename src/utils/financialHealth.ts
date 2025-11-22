export interface FinancialData {
  monthlyIncome: number
  monthlyExpenses: number
  savings: number
  debt: number
  investments: number
  financialGoals: 'conservative' | 'moderate' | 'aggressive'
}

export interface HealthMetrics {
  fitnessLevel: number
  weightLevel: number
  stressLevel: number
  happinessLevel: number
  bodyType: 'average' | 'fit' | 'heavy'
  gender: 'male' | 'female'
}

export function calculateFinancialHealth(data: FinancialData): HealthMetrics {
  const { monthlyIncome, monthlyExpenses, savings, debt, investments, financialGoals } = data
  
  // Calculate key financial ratios
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) : 0
  const debtToIncomeRatio = monthlyIncome > 0 ? (debt / monthlyIncome) : 0
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) : 0
  const investmentRatio = monthlyIncome > 0 ? (investments / monthlyIncome) : 0
  
  // Financial health score (0-100)
  let financialScore = 0
  
  // Savings rate impact (0-30 points)
  if (savingsRate >= 0.2) financialScore += 30
  else if (savingsRate >= 0.15) financialScore += 25
  else if (savingsRate >= 0.1) financialScore += 20
  else if (savingsRate >= 0.05) financialScore += 15
  else financialScore += savingsRate * 300
  
  // Debt management impact (0-25 points)
  if (debtToIncomeRatio <= 0.1) financialScore += 25
  else if (debtToIncomeRatio <= 0.2) financialScore += 20
  else if (debtToIncomeRatio <= 0.3) financialScore += 15
  else if (debtToIncomeRatio <= 0.4) financialScore += 10
  else if (debtToIncomeRatio <= 0.5) financialScore += 5
  
  // Expense management impact (0-20 points)
  if (expenseRatio <= 0.6) financialScore += 20
  else if (expenseRatio <= 0.7) financialScore += 15
  else if (expenseRatio <= 0.8) financialScore += 10
  else if (expenseRatio <= 0.9) financialScore += 5
  
  // Investment impact (0-15 points)
  if (investmentRatio >= 0.15) financialScore += 15
  else if (investmentRatio >= 0.1) financialScore += 12
  else if (investmentRatio >= 0.05) financialScore += 8
  else if (investmentRatio >= 0.02) financialScore += 4
  
  // Financial goals adjustment (0-10 points)
  if (financialGoals === 'aggressive') financialScore += 10
  else if (financialGoals === 'moderate') financialScore += 7
  else financialScore += 5
  
  // Normalize financial score to 0-1
  const normalizedScore = Math.min(100, Math.max(0, financialScore)) / 100
  
  // Map financial health to avatar metrics
  const metrics: HealthMetrics = {
    fitnessLevel: Math.min(1, savingsRate * 3 + investmentRatio * 2), // Higher savings/investment = fitter
    weightLevel: Math.min(1, expenseRatio), // Higher expenses = heavier appearance
    stressLevel: Math.min(1, debtToIncomeRatio * 2 + Math.max(0, expenseRatio - 0.7) * 2), // Debt and overspending cause stress
    happinessLevel: Math.min(1, normalizedScore * 1.2), // Overall financial health affects happiness
    bodyType: 'average',
    gender: 'male' // Default, can be changed by user
  }
  
  // Determine body type based on financial metrics
  if (metrics.fitnessLevel > 0.7 && metrics.stressLevel < 0.3) {
    metrics.bodyType = 'fit'
  } else if (metrics.weightLevel > 0.7 || metrics.stressLevel > 0.6) {
    metrics.bodyType = 'heavy'
  } else {
    metrics.bodyType = 'average'
  }
  
  // Ensure all values are within 0-1 range
  Object.keys(metrics).forEach(key => {
    if (typeof metrics[key as keyof HealthMetrics] === 'number') {
      const numKey = key as keyof Pick<HealthMetrics, 'fitnessLevel' | 'weightLevel' | 'stressLevel' | 'happinessLevel'>
      if (metrics[numKey] < 0) metrics[numKey] = 0
      if (metrics[numKey] > 1) metrics[numKey] = 1
    }
  })
  
  return metrics
}

export function getFinancialAdvice(data: FinancialData): string[] {
  const { monthlyIncome, monthlyExpenses, savings, debt, investments } = data
  const advice: string[] = []
  
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) : 0
  const debtToIncomeRatio = monthlyIncome > 0 ? (debt / monthlyIncome) : 0
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) : 0
  
  if (savingsRate < 0.1) {
    advice.push('Consider increasing your savings rate to at least 10% of your income')
  }
  
  if (debtToIncomeRatio > 0.3) {
    advice.push('Your debt-to-income ratio is high. Focus on debt reduction strategies')
  }
  
  if (expenseRatio > 0.8) {
    advice.push('Your expenses are consuming too much of your income. Review your spending habits')
  }
  
  if (investments / monthlyIncome < 0.05) {
    advice.push('Consider starting or increasing your investment contributions')
  }
  
  if (savingsRate >= 0.2 && debtToIncomeRatio <= 0.2 && expenseRatio <= 0.7) {
    advice.push('Excellent financial health! Keep up the good work')
  }
  
  return advice
}