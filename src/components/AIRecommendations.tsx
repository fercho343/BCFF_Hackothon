import { useState } from 'react';
import { financialAI, FinancialRecommendation } from '@/lib/ai';
import { useFinancialHabitsStore } from '@/stores/financialHabitsStore';
import { useAuthStore } from '@/stores/authStore';
import { TrendingUp, TrendingDown, DollarSign, Target, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface AIRecommendationsProps {
  className?: string;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  className = '' 
}) => {
  const [recommendations, setRecommendations] = useState<FinancialRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000);
  
  const { habits } = useFinancialHabitsStore();
  const { user } = useAuthStore();

  const generateRecommendations = async () => {
    if (!user) {
      toast.error('Please log in to get AI recommendations');
      return;
    }

    setIsLoading(true);
    
    try {
      const userHabits = habits.filter(h => h.userId === user.id);
      const aiRecommendations = await financialAI.generateFinancialRecommendations(
        userHabits,
        monthlyIncome,
        monthlyExpenses
      );
      
      setRecommendations(aiRecommendations);
      toast.success('AI recommendations generated successfully!');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'budgeting': return <Target className="w-5 h-5" />;
      case 'savings': return <DollarSign className="w-5 h-5" />;
      case 'investment': return <TrendingUp className="w-5 h-5" />;
      case 'debt': return <TrendingDown className="w-5 h-5" />;
      case 'spending': return <Lightbulb className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">AI Financial Recommendations</h3>
        <button
          onClick={generateRecommendations}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Financial Overview Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income ($)
          </label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="3000"
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
            placeholder="2000"
          />
        </div>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getCategoryIcon(recommendation.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {recommendation.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {recommendation.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="capitalize">
                      {recommendation.category}
                    </span>
                    {recommendation.estimatedSavings && (
                      <span className="text-green-600 font-medium">
                        Save ~${recommendation.estimatedSavings}/month
                      </span>
                    )}
                    <span>
                      Timeframe: {recommendation.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Click "Get Recommendations" to receive personalized AI-powered financial advice based on your habits and financial situation.
          </p>
        </div>
      )}
    </div>
  );
};