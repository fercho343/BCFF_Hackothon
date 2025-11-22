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
}

export interface FinancialRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings?: number;
  timeframe: string;
}

export class FinancialAIAssistant {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async generateFinancialRecommendations(
    habits: FinancialHabit[],
    monthlyIncome: number,
    monthlyExpenses: number
  ): Promise<FinancialRecommendation[]> {
    const prompt = `
    Based on the following financial habits and financial situation:
    
    Monthly Income: $${monthlyIncome}
    Monthly Expenses: $${monthlyExpenses}
    
    Financial Habits:
    ${habits.map(habit => `- ${habit.category}: $${habit.amount} ${habit.frequency} - ${habit.description}`).join('\n')}
    
    Please provide 3-5 specific, actionable financial recommendations that would help improve this person's financial situation. 
    Consider:
    - Budget optimization
    - Savings opportunities
    - Debt reduction strategies
    - Investment suggestions
    - Spending habit improvements
    
    Format the response as JSON with the following structure:
    {
      "recommendations": [
        {
          "title": "Recommendation title",
          "description": "Detailed description",
          "category": "budgeting|savings|investment|debt|spending",
          "priority": "high|medium|low",
          "estimatedSavings": monthly_dollar_amount (if applicable),
          "timeframe": "1 month|3 months|6 months|1 year"
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

  async analyzeVoiceTranscript(transcript: string): Promise<{
    intent: 'expense' | 'income' | 'question' | 'budget' | 'savings' | 'unknown';
    extractedData?: {
      amount?: number;
      category?: string;
      description?: string;
      date?: string;
    };
    response: string;
  }> {
    const prompt = `
    Analyze this voice transcript from a financial app user:
    "${transcript}"
    
    Determine:
    1. The user's intent (expense, income, question, budget, savings, or unknown)
    2. Extract any financial data (amount, category, description, date)
    3. Provide an appropriate response
    
    Format as JSON:
    {
      "intent": "expense|income|question|budget|savings|unknown",
      "extractedData": {
        "amount": number_or_null,
        "category": "string_or_null",
        "description": "string_or_null",
        "date": "YYYY-MM-DD_or_null"
      },
      "response": "Helpful response to the user"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        intent: 'unknown',
        response: 'I didn\'t understand that. Could you please rephrase?'
      };
    } catch (error) {
      console.error('Error analyzing voice transcript:', error);
      return {
        intent: 'unknown',
        response: 'I\'m having trouble processing your request. Please try again.'
      };
    }
  }

  async answerFinancialQuestion(question: string): Promise<string> {
    const prompt = `
    As a financial advisor AI, answer this question clearly and helpfully:
    "${question}"
    
    Provide a concise, actionable response that would be helpful for someone managing their personal finances.
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
}

export const financialAI = new FinancialAIAssistant();