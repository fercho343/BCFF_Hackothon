import { useState, useEffect, useCallback } from 'react';
import { financialAI, FinancialHabit, FinancialRecommendation } from '@/lib/aiEnhanced';
import { useFinancialHabitsStore } from '@/stores/financialHabitsStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Lightbulb, 
  RefreshCw, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface AIRecommendationsEnhancedProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface RecommendationWithAnalytics extends FinancialRecommendation {
  impactScore: number;
  feasibilityScore: number;
  urgencyScore: number;
  relatedHabits: string[];
  implementationSteps: string[];
  monthlyImpact: number;
}

interface FinancialAnalytics {
  savingsRate: number;
  debtToIncomeRatio: number;
  discretionarySpending: number;
  financialHealthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  topSpendingCategories?: { category: string; amount: number; percentage: number }[];
  topCategories: { category: string; amount: number; percentage: number }[];
}

export const AIRecommendationsEnhanced: React.FC<AIRecommendationsEnhancedProps> = ({ 
  className = '',
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationWithAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(3500);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2500);
  const [financialGoals, setFinancialGoals] = useState('');
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(autoRefresh);
  
  const { habits, getSpendingInsights } = useFinancialHabitsStore();
  const { user } = useAuthStore();

  // Auto-generate recommendations when analytics are available
  useEffect(() => {
    if (analytics && analytics.topCategories && analytics.topCategories.length > 0 && recommendations.length === 0) {
      generateEnhancedRecommendations();
    }
  }, [analytics, recommendations.length]);

  // Calculate analytics when data changes
  useEffect(() => {
    if (user && habits.length > 0) {
      const newAnalytics = calculateAnalytics();
      setAnalytics(newAnalytics);
    }
  }, [user, habits, monthlyIncome, monthlyExpenses]); // Removed calculateAnalytics from deps to avoid circular dependency

  // Calculate financial analytics
  const calculateAnalytics = useCallback((): FinancialAnalytics => {
    const insights = getSpendingInsights();
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const debtToIncomeRatio = monthlyExpenses > monthlyIncome ? ((monthlyExpenses - monthlyIncome) / monthlyIncome) * 100 : 0;
    const discretionarySpending = monthlyIncome - monthlyExpenses;
    
    let healthScore = 50;
    if (savingsRate > 20) healthScore += 20;
    else if (savingsRate > 10) healthScore += 10;
    else if (savingsRate < 0) healthScore -= 20;
    
    if (discretionarySpending > 1000) healthScore += 10;
    else if (discretionarySpending < 0) healthScore -= 30;
    
    if (insights.averageDailySpending && insights.averageDailySpending < 50) healthScore += 10;
    else if (insights.averageDailySpending && insights.averageDailySpending > 100) healthScore -= 10;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (healthScore > 70) riskLevel = 'low';
    else if (healthScore < 30) riskLevel = 'high';
    
    // Get top spending categories with percentages
    const totalSpending = (insights.averageDailySpending || 0) * 30;
    const topCategories = insights.topCategories && insights.topCategories.length > 0 
      ? insights.topCategories.map(category => {
          const categoryHabits = habits.filter(h => h.userId === user?.id && h.category.toLowerCase() === category.toLowerCase());
          const categoryTotal = categoryHabits.reduce((sum, h) => {
            let monthlyAmount = h.amount;
            if (h.frequency === 'daily') monthlyAmount *= 30;
            else if (h.frequency === 'weekly') monthlyAmount *= 4;
            else if (h.frequency === 'yearly') monthlyAmount /= 12;
            return sum + monthlyAmount;
          }, 0);
          
          return {
            category,
            amount: categoryTotal,
            percentage: totalSpending > 0 ? (categoryTotal / totalSpending) * 100 : 0
          };
        }).sort((a, b) => b.amount - a.amount).slice(0, 5)
      : [];
    
    return {
      savingsRate,
      debtToIncomeRatio,
      discretionarySpending,
      financialHealthScore: Math.round(healthScore),
      riskLevel,
      topCategories
    };
  }, [monthlyIncome, monthlyExpenses, habits, user?.id, getSpendingInsights]);

  // Enhanced recommendation generation
  const generateEnhancedRecommendations = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to get AI recommendations');
      return;
    }

    // Validate required data
    if (!analytics || !analytics.topCategories || analytics.topCategories.length === 0) {
      toast.warning('Please add some financial data or habits to get personalized recommendations.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate current analytics
      const currentAnalytics = calculateAnalytics();
      setAnalytics(currentAnalytics);
      
      const userHabits = habits.filter(h => h.userId === user.id);
      
      // Enhanced prompt with more context
      const prompt = `
      Based on the following comprehensive financial analysis:
      
      FINANCIAL OVERVIEW:
      - Monthly Income: $${monthlyIncome}
      - Monthly Expenses: $${monthlyExpenses}
      - Savings Rate: ${currentAnalytics.savingsRate.toFixed(1)}%
      - Debt-to-Income Ratio: ${currentAnalytics.debtToIncomeRatio.toFixed(1)}%
      - Financial Health Score: ${currentAnalytics.financialHealthScore}/100
      - Risk Level: ${currentAnalytics.riskLevel}
      - Discretionary Spending: $${currentAnalytics.discretionarySpending.toFixed(2)}
      
      TOP SPENDING CATEGORIES:
      ${currentAnalytics.topSpendingCategories.map(cat => 
        `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
      ).join('\n')}
      
      FINANCIAL HABITS:
      ${userHabits.map(habit => 
        `- ${habit.category}: $${habit.amount} ${habit.frequency} - ${habit.description} ${habit.isRecurring ? '(Recurring)' : ''}`
      ).join('\n')}
      
      ${financialGoals ? `USER GOALS: ${financialGoals}` : ''}
      
      Please provide 5-7 highly specific, actionable financial recommendations. Each recommendation should:
      
      1. Be directly tied to the user's current financial situation
      2. Include specific dollar amounts and timeframes
      3. Consider their risk level (${currentAnalytics.riskLevel})
      4. Address their top spending categories
      5. Include implementation steps
      6. Provide impact scores (1-10) based on potential benefit
      7. Provide feasibility scores (1-10) based on ease of implementation
      8. Provide urgency scores (1-10) based on time sensitivity
      
      Format as JSON:
      {
        "recommendations": [
          {
            "id": "unique-id",
            "title": "Specific recommendation title",
            "description": "Detailed explanation with specific numbers and reasoning",
            "category": "budgeting|savings|investment|debt|spending|emergency",
            "priority": "high|medium|low",
            "estimatedSavings": monthly_dollar_amount,
            "timeframe": "1 week|1 month|3 months|6 months|1 year",
            "impactScore": 1-10,
            "feasibilityScore": 1-10,
            "urgencyScore": 1-10,
            "relatedHabits": ["habit categories this addresses"],
            "implementationSteps": ["step 1", "step 2", "step 3"],
            "monthlyImpact": estimated_monthly_impact
          }
        ]
      }
      `;

      const result = await financialAI.getModel().generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Response:', text); // Debug log
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No JSON found in AI response');
        toast.error('AI response format error - no valid recommendations found');
        setRecommendations([]);
        return;
      }
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Ensure recommendations array exists and is valid
          if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
            const enhancedRecommendations: RecommendationWithAnalytics[] = parsed.recommendations.map((rec: any) => ({
              ...rec,
              id: rec.id || crypto.randomUUID(),
              impactScore: rec.impactScore || 5,
              feasibilityScore: rec.feasibilityScore || 5,
              urgencyScore: rec.urgencyScore || 5,
              relatedHabits: rec.relatedHabits || [],
              implementationSteps: rec.implementationSteps || [],
              monthlyImpact: rec.monthlyImpact || rec.estimatedSavings || 0
            }));
            
            // Sort by impact score
            enhancedRecommendations.sort((a, b) => b.impactScore - a.impactScore);
            
            setRecommendations(enhancedRecommendations);
            setLastUpdated(new Date());
            toast.success('Enhanced AI recommendations generated successfully!');
          } else {
            // Fallback to empty array if no valid recommendations
            setRecommendations([]);
            toast.warning('No recommendations could be generated. Please check your financial data.');
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          toast.error('Failed to parse AI recommendations response');
          setRecommendations([]);
        }
      } else {
        toast.error('Failed to extract valid recommendations from AI response');
        setRecommendations([]);
      }
      
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error);
      toast.error('Failed to generate enhanced recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user, monthlyIncome, monthlyExpenses, financialGoals, habits, calculateAnalytics]);

  // Auto-refresh functionality
  useEffect(() => {
    if (isAutoMode && user) {
      const interval = setInterval(() => {
        generateEnhancedRecommendations();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [isAutoMode, user, refreshInterval, generateEnhancedRecommendations]);

  // Initial load
  useEffect(() => {
    if (user && habits.length > 0) {
      generateEnhancedRecommendations();
    }
  }, [user, habits.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">AI Financial Recommendations</h3>
          <p className="text-sm text-gray-500">Smart, personalized financial advice</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`p-2 rounded-lg transition-colors ${
              isAutoMode 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Auto-refresh recommendations"
          >
            <RefreshCw size={16} className={isAutoMode ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={generateEnhancedRecommendations}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                <span>Get Smart Advice</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Analytics Overview */}
      {analytics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Financial Health Analysis</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(analytics.riskLevel)}`}>
              {analytics.riskLevel.toUpperCase()} RISK
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.financialHealthScore}</p>
              <p className="text-xs text-gray-600">Health Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.savingsRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">Savings Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">${analytics.discretionarySpending.toFixed(0)}</p>
              <p className="text-xs text-gray-600">Discretionary</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.topSpendingCategories.length}</p>
              <p className="text-xs text-gray-600">Top Categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Financial Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income ($)
          </label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="3500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Expenses ($)
          </label>
          <input
            type="number"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Financial Goals
          </label>
          <input
            type="text"
            value={financialGoals}
            onChange={(e) => setFinancialGoals(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., save for house, pay off debt"
          />
        </div>
      </div>

      {/* Enhanced Recommendations List */}
      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-full ${getPriorityColor(recommendation.priority)}`}>
                    <Target className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      {recommendation.title || 'Untitled Recommendation'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                        {(recommendation.priority || 'medium').toUpperCase()}
                      </span>
                      {recommendation.estimatedSavings && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          +${recommendation.estimatedSavings}/mo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {recommendation.description || 'No description available.'}
                  </p>
                  
                  {/* Analytics Scores */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className={`text-lg font-bold ${getScoreColor(recommendation.impactScore || 5)}`}>
                        {recommendation.impactScore || 5}/10
                      </p>
                      <p className="text-xs text-gray-600">Impact</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className={`text-lg font-bold ${getScoreColor(recommendation.feasibilityScore || 5)}`}>
                        {recommendation.feasibilityScore || 5}/10
                      </p>
                      <p className="text-xs text-gray-600">Feasibility</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className={`text-lg font-bold ${getScoreColor(recommendation.urgencyScore || 5)}`}>
                        {recommendation.urgencyScore || 5}/10
                      </p>
                      <p className="text-xs text-gray-600">Urgency</p>
                    </div>
                  </div>

                  {/* Implementation Steps */}
                  {recommendation.implementationSteps && recommendation.implementationSteps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Implementation Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {recommendation.implementationSteps.map((step, index) => (
                          <li key={index} className="text-sm text-gray-600">{step || 'Step description unavailable'}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="capitalize text-gray-500 font-medium">
                        {recommendation.category || 'general'}
                      </span>
                      <span className="text-gray-400">
                        {recommendation.timeframe || 'ongoing'}
                      </span>
                    </div>
                    {recommendation.relatedHabits && recommendation.relatedHabits.length > 0 && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Affects: {recommendation.relatedHabits.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Recommendations Yet</h4>
          <p className="text-gray-500 mb-4">
            Add some financial habits and click "Get Smart Advice" to receive personalized AI-powered recommendations.
          </p>
          <p className="text-sm text-gray-400">
            The AI will analyze your spending patterns, income, and financial goals to provide actionable advice.
          </p>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-6 text-center text-xs text-gray-400">
          <Clock size={12} className="inline mr-1" />
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
};