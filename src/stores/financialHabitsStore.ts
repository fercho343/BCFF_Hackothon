import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export interface HabitPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  totalSpent: number;
}

interface FinancialHabitsStore {
  habits: FinancialHabit[];
  patterns: HabitPattern[];
  
  // Actions
  addHabit: (habit: Omit<FinancialHabit, 'id' | 'timestamp'>) => void;
  updateHabit: (id: string, updates: Partial<FinancialHabit>) => void;
  deleteHabit: (id: string) => void;
  getHabitsByCategory: (category: string) => FinancialHabit[];
  getHabitsByDateRange: (startDate: Date, endDate: Date) => FinancialHabit[];
  analyzePatterns: () => void;
  getSpendingInsights: () => {
    topCategories: string[];
    totalRecurring: number;
    averageDailySpending: number;
    recommendations: string[];
  };
}

export const useFinancialHabitsStore = create<FinancialHabitsStore>()(
  persist(
    (set, get) => ({
      habits: [],
      patterns: [],

      addHabit: (habitData) => {
        const newHabit: FinancialHabit = {
          ...habitData,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          habits: [...state.habits, newHabit]
        }));
        
        // Analyze patterns after adding new habit
        get().analyzePatterns();
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map(habit => 
            habit.id === id ? { ...habit, ...updates } : habit
          )
        }));
        
        get().analyzePatterns();
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter(habit => habit.id !== id)
        }));
        
        get().analyzePatterns();
      },

      getHabitsByCategory: (category) => {
        return get().habits.filter(habit => 
          habit.category.toLowerCase() === category.toLowerCase()
        );
      },

      getHabitsByDateRange: (startDate, endDate) => {
        return get().habits.filter(habit => {
          const habitDate = new Date(habit.timestamp);
          return habitDate >= startDate && habitDate <= endDate;
        });
      },

      analyzePatterns: () => {
        const { habits } = get();
        const patterns: HabitPattern[] = [];
        
        // Group habits by category
        const categoryGroups = habits.reduce((acc, habit) => {
          if (!acc[habit.category]) {
            acc[habit.category] = [];
          }
          acc[habit.category].push(habit);
          return acc;
        }, {} as Record<string, FinancialHabit[]>);

        // Analyze each category
        Object.entries(categoryGroups).forEach(([category, categoryHabits]) => {
          const totalSpent = categoryHabits.reduce((sum, habit) => sum + habit.amount, 0);
          const averageAmount = totalSpent / categoryHabits.length;
          const frequency = categoryHabits.length;
          
          // Simple trend analysis (compare recent vs older habits)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentHabits = categoryHabits.filter(h => 
            new Date(h.timestamp) > thirtyDaysAgo
          );
          const olderHabits = categoryHabits.filter(h => 
            new Date(h.timestamp) <= thirtyDaysAgo
          );
          
          const recentAverage = recentHabits.length > 0 
            ? recentHabits.reduce((sum, h) => sum + h.amount, 0) / recentHabits.length 
            : 0;
          const olderAverage = olderHabits.length > 0 
            ? olderHabits.reduce((sum, h) => sum + h.amount, 0) / olderHabits.length 
            : 0;
          
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
          if (recentAverage > olderAverage * 1.1) trend = 'increasing';
          else if (recentAverage < olderAverage * 0.9) trend = 'decreasing';
          
          patterns.push({
            category,
            averageAmount,
            frequency,
            trend,
            totalSpent
          });
        });

        set({ patterns });
      },

      getSpendingInsights: () => {
        const { habits, patterns } = get();
        
        // Get top spending categories
        const topCategories = patterns
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 3)
          .map(p => p.category);

        // Calculate recurring expenses
        const totalRecurring = habits
          .filter(h => h.isRecurring)
          .reduce((sum, h) => {
            let monthlyAmount = h.amount;
            if (h.frequency === 'daily') monthlyAmount *= 30;
            else if (h.frequency === 'weekly') monthlyAmount *= 4;
            else if (h.frequency === 'yearly') monthlyAmount /= 12;
            return sum + monthlyAmount;
          }, 0);

        // Calculate average daily spending
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentHabits = habits.filter(h => 
          new Date(h.timestamp) > thirtyDaysAgo
        );
        
        const totalRecentSpending = recentHabits.reduce((sum, h) => {
          let dailyAmount = h.amount;
          if (h.frequency === 'weekly') dailyAmount /= 7;
          else if (h.frequency === 'monthly') dailyAmount /= 30;
          else if (h.frequency === 'yearly') dailyAmount /= 365;
          return sum + dailyAmount;
        }, 0);
        
        const averageDailySpending = totalRecentSpending / 30;

        // Generate basic recommendations
        const recommendations: string[] = [];
        
        patterns.forEach(pattern => {
          if (pattern.trend === 'increasing' && pattern.totalSpent > 500) {
            recommendations.push(`Consider reducing spending in ${pattern.category} - it's been increasing lately`);
          }
        });
        
        if (totalRecurring > averageDailySpending * 30 * 0.7) {
          recommendations.push('A large portion of your spending is recurring - look for subscription services to cancel');
        }
        
        if (averageDailySpending > 100) {
          recommendations.push('Your daily spending is quite high - try setting daily spending limits');
        }

        return {
          topCategories,
          totalRecurring,
          averageDailySpending,
          recommendations
        };
      }
    }),
    {
      name: 'financial-habits-storage',
    }
  )
);