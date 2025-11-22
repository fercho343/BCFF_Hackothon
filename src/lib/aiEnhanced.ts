import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface FinancialHabit {
  id: string;
  userId: string;
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  description: string;
  timestamp: Date;
  isRecurring: boolean;
}

export interface FinancialRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings?: number;
  timeframe: string;
  impactScore?: number;
  feasibilityScore?: number;
  urgencyScore?: number;
  relatedHabits?: string[];
  implementationSteps?: string[];
  monthlyImpact?: number;
}

export interface VoiceAnalysisResult {
  intent: 'expense' | 'income' | 'question' | 'budget' | 'savings' | 'unknown';
  confidence: number;
  extractedData?: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    merchant?: string;
    paymentMethod?: string;
  };
  response: string;
  followUpQuestions?: string[];
  suggestedActions?: string[];
}

export interface FinancialAnalytics {
  savingsRate: number;
  debtToIncomeRatio: number;
  discretionarySpending: number;
  financialHealthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  topSpendingCategories: { category: string; amount: number; percentage: number }[];
  monthlyTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export class FinancialAIAssistant {
  private model;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  // Enhanced real-time voice transcript analysis
  async analyzeVoiceTranscript(transcript: string, context?: {
    recentHabits?: FinancialHabit[];
    monthlyIncome?: number;
    monthlyExpenses?: number;
  }): Promise<VoiceAnalysisResult> {
    console.log('Analyzing voice transcript:', transcript);
    console.log('Context:', context);
    
    const contextInfo = context ? `
    Context:
    - Monthly Income: $${context.monthlyIncome || 0}
    - Monthly Expenses: $${context.monthlyExpenses || 0}
    - Recent Habits: ${context.recentHabits?.map(h => `${h.category}: $${h.amount}`).join(', ') || 'None'}
    ` : '';

    const prompt = `
    Analyze this real-time voice transcript from a financial app user:
    "${transcript}"
    
    ${contextInfo}
    
    Provide a comprehensive analysis with:
    1. Intent classification (expense, income, question, budget, savings, unknown)
    2. Confidence score (0-1)
    3. Extracted financial data (amount, category, description, date, merchant, payment method)
    4. Appropriate response
    5. Follow-up questions if needed
    6. Suggested actions
    
    Format as JSON:
    {
      "intent": "expense|income|question|budget|savings|unknown",
      "confidence": 0.0-1.0,
      "extractedData": {
        "amount": number_or_null,
        "category": "string_or_null",
        "description": "string_or_null",
        "date": "YYYY-MM-DD_or_null",
        "merchant": "string_or_null",
        "paymentMethod": "string_or_null"
      },
      "response": "Helpful, contextual response",
      "followUpQuestions": ["question1", "question2"],
      "suggestedActions": ["action1", "action2"]
    }
    `;

    try {
      console.log('Sending prompt to Gemini API:', prompt);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini API response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', parsed);
        return {
          intent: parsed.intent || 'unknown',
          confidence: parsed.confidence || 0.5,
          extractedData: parsed.extractedData || {},
          response: parsed.response || 'I didn\'t understand that. Could you please rephrase?',
          followUpQuestions: parsed.followUpQuestions || [],
          suggestedActions: parsed.suggestedActions || []
        };
      }
      
      return {
        intent: 'unknown',
        confidence: 0,
        response: 'I didn\'t understand that. Could you please rephrase?'
      };
    } catch (error) {
      console.error('Error analyzing voice transcript:', error);
      console.error('Error details:', error.message, error.stack);
      return {
        intent: 'unknown',
        confidence: 0,
        response: 'I\'m having trouble processing your request. Please try again.'
      };
    }
  }

  // Enhanced financial recommendations with analytics
  async generateFinancialRecommendations(
    habits: FinancialHabit[],
    monthlyIncome: number,
    monthlyExpenses: number,
    financialGoals?: string
  ): Promise<FinancialRecommendation[]> {
    const analytics = this.calculateFinancialAnalytics(habits, monthlyIncome, monthlyExpenses);
    
    const prompt = `
    Based on this comprehensive financial analysis:
    
    FINANCIAL OVERVIEW:
    - Monthly Income: $${monthlyIncome}
    - Monthly Expenses: $${monthlyExpenses}
    - Savings Rate: ${analytics.savingsRate.toFixed(1)}%
    - Debt-to-Income Ratio: ${analytics.debtToIncomeRatio.toFixed(1)}%
    - Financial Health Score: ${analytics.financialHealthScore}/100
    - Risk Level: ${analytics.riskLevel}
    - Monthly Trend: ${analytics.monthlyTrend}
    - Discretionary Spending: $${analytics.discretionarySpending.toFixed(2)}
    
    TOP SPENDING CATEGORIES:
    ${analytics.topSpendingCategories.map(cat => 
      `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
    ).join('\n')}
    
    FINANCIAL HABITS:
    ${habits.map(habit => 
      `- ${habit.category}: $${habit.amount} ${habit.frequency} - ${habit.description} ${habit.isRecurring ? '(Recurring)' : ''}`
    ).join('\n')}
    
    ${financialGoals ? `USER GOALS: ${financialGoals}` : ''}
    
    Generate 5-7 highly specific, actionable financial recommendations that address:
    1. Immediate quick wins (1-2 weeks)
    2. Medium-term improvements (1-3 months)
    3. Long-term strategies (6+ months)
    4. Risk mitigation based on their risk level
    5. Optimization of their top spending categories
    6. Achievement of their stated goals
    
    Each recommendation must include:
    - Specific dollar amounts and calculations
    - Implementation steps
    - Impact, feasibility, and urgency scores (1-10)
    - Related habits it addresses
    - Monthly impact estimate
    
    Format as JSON:
    {
      "recommendations": [
        {
          "id": "unique-id",
          "title": "Specific, actionable title",
          "description": "Detailed explanation with specific numbers, calculations, and reasoning",
          "category": "budgeting|savings|investment|debt|spending|emergency|optimization",
          "priority": "high|medium|low",
          "estimatedSavings": monthly_dollar_amount,
          "timeframe": "1 week|1 month|3 months|6 months|1 year",
          "impactScore": 1-10,
          "feasibilityScore": 1-10,
          "urgencyScore": 1-10,
          "relatedHabits": ["habit_category_1", "habit_category_2"],
          "implementationSteps": ["Step 1: specific action", "Step 2: specific action"],
          "monthlyImpact": estimated_monthly_savings_or_earnings
        }
      ]
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.recommendations || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // Calculate financial analytics
  calculateFinancialAnalytics(
    habits: FinancialHabit[],
    monthlyIncome: number,
    monthlyExpenses: number
  ): FinancialAnalytics {
    // Calculate spending by category
    const categorySpending = new Map<string, number>();
    let totalRecurring = 0;
    
    habits.forEach(habit => {
      let monthlyAmount = habit.amount;
      if (habit.frequency === 'daily') monthlyAmount *= 30;
      else if (habit.frequency === 'weekly') monthlyAmount *= 4;
      else if (habit.frequency === 'yearly') monthlyAmount /= 12;
      
      categorySpending.set(
        habit.category, 
        (categorySpending.get(habit.category) || 0) + monthlyAmount
      );
      
      if (habit.isRecurring) {
        totalRecurring += monthlyAmount;
      }
    });
    
    // Calculate top spending categories
    const topSpendingCategories = Array.from(categorySpending.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Calculate key metrics
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const discretionarySpending = monthlyExpenses - totalRecurring;
    
    // Calculate financial health score
    let healthScore = 50; // Base score
    if (savingsRate > 20) healthScore += 20;
    else if (savingsRate > 10) healthScore += 10;
    else if (savingsRate < 5) healthScore -= 15;
    
    if (debtToIncomeRatio < 30) healthScore += 15;
    else if (debtToIncomeRatio > 50) healthScore -= 20;
    
    if (discretionarySpending < monthlyIncome * 0.2) healthScore += 10;
    else if (discretionarySpending > monthlyIncome * 0.4) healthScore -= 10;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (healthScore > 70) riskLevel = 'low';
    else if (healthScore < 30) riskLevel = 'high';
    
    // Determine monthly trend (simplified)
    const monthlyTrend: 'improving' | 'stable' | 'declining' = 
      savingsRate > 15 ? 'improving' : 
      savingsRate > 5 ? 'stable' : 'declining';
    
    // Generate basic recommendations
    const recommendations: string[] = [];
    
    if (savingsRate < 10) {
      recommendations.push('Increase your savings rate to at least 10% of income');
    }
    if (debtToIncomeRatio > 40) {
      recommendations.push('Reduce your debt-to-income ratio below 40%');
    }
    if (discretionarySpending > monthlyIncome * 0.3) {
      recommendations.push('Reduce discretionary spending to free up more money for savings');
    }
    
    topSpendingCategories.forEach(cat => {
      if (cat.percentage > 25) {
        recommendations.push(`Consider reducing spending in ${cat.category} which represents ${cat.percentage.toFixed(1)}% of expenses`);
      }
    });
    
    return {
      savingsRate,
      debtToIncomeRatio,
      discretionarySpending,
      financialHealthScore: Math.round(healthScore),
      riskLevel,
      topSpendingCategories,
      monthlyTrend,
      recommendations
    };
  }

  // Answer financial questions with context
  async answerFinancialQuestion(question: string, context?: {
    habits?: FinancialHabit[];
    monthlyIncome?: number;
    monthlyExpenses?: number;
  }): Promise<string> {
    const contextInfo = context ? `
    Context:
    - Monthly Income: $${context.monthlyIncome || 0}
    - Monthly Expenses: $${context.monthlyExpenses || 0}
    - Financial Habits: ${context.habits?.length || 0} tracked
    ` : '';

    const prompt = `
    As an expert financial advisor, answer this question clearly and helpfully:
    "${question}"
    
    ${contextInfo}
    
    Provide a comprehensive, actionable response that includes:
    1. Direct answer to the question
    2. Specific examples or calculations if relevant
    3. Actionable next steps
    4. Consideration of the user's financial context
    
    Keep the response concise but thorough, and ensure it's helpful for someone managing their personal finances.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error answering financial question:', error);
      return 'I\'m sorry, I\'m having trouble answering your question. Please try again.';
    }
  }

  // Real-time financial coaching
  async getFinancialCoachingTip(habits: FinancialHabit[]): Promise<string> {
    const prompt = `
    Based on these recent financial habits:
    ${habits.slice(-5).map(h => `- ${h.category}: $${h.amount} ${h.description}`).join('\n')}
    
    Provide a brief, actionable financial coaching tip (1-2 sentences) that:
    1. Addresses a specific pattern or behavior
    2. Offers immediate, practical advice
    3. Is encouraging and supportive
    4. Relates to common financial best practices
    
    Keep it conversational and motivating.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating coaching tip:', error);
      return 'Keep tracking your expenses to build better financial habits!';
    }
  }

  getModel() {
    return this.model;
  }
}

export const financialAI = new FinancialAIAssistant();