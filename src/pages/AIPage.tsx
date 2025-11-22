import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useFinancialHabitsStore } from '@/stores/financialHabitsStore';
import { VoiceAssistantRealTime } from '@/components/VoiceAssistantRealTime';
import { AIRecommendationsEnhanced } from '@/components/AIRecommendationsEnhanced';
import { HabitTracker } from '@/components/HabitTracker';
import { financialAI } from '@/lib/aiEnhanced';
import { 
  Brain, 
  Mic, 
  TrendingUp, 
  Target, 
  ArrowLeft, 
  Settings,
  Zap,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { habits } = useFinancialHabitsStore();
  
  const [activeTab, setActiveTab] = useState<'voice' | 'recommendations' | 'habits'>('voice');
  const [realTimeCoaching, setRealTimeCoaching] = useState(true);
  const [coachingTip, setCoachingTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate real-time coaching tips
  useEffect(() => {
    if (realTimeCoaching && habits.length > 0) {
      const generateCoachingTip = async () => {
        try {
          const userHabits = habits.filter(h => h.userId === user?.id);
          if (userHabits.length > 0) {
            const tip = await financialAI.getFinancialCoachingTip(userHabits);
            setCoachingTip(tip);
          }
        } catch (error) {
          console.error('Error generating coaching tip:', error);
        }
      };

      generateCoachingTip();
      
      // Update coaching tip every 30 seconds
      const interval = setInterval(generateCoachingTip, 30000);
      return () => clearInterval(interval);
    }
  }, [realTimeCoaching, habits, user?.id]);

  const handleVoiceTranscript = async (transcript: string, analysis: any) => {
    try {
      // Enhanced voice processing with real-time coaching
      if (analysis.intent === 'question' && analysis.confidence > 0.7) {
        const userHabits = habits.filter(h => h.userId === user?.id);
        const answer = await financialAI.answerFinancialQuestion(transcript, {
          habits: userHabits,
          monthlyIncome: 3500, // This could be dynamic
          monthlyExpenses: 2500 // This could be dynamic
        });
        
        // Use text-to-speech for the answer
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(answer);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Error processing voice transcript:', error);
    }
  };

  const refreshRecommendations = async () => {
    setIsLoading(true);
    try {
      // This would trigger a refresh in the recommendations component
      toast.success('Refreshing AI recommendations...');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast.error('Failed to refresh recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">AI Features</h2>
          <p className="text-gray-600 mb-6">Please log in to access AI-powered financial features</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">AI Financial Assistant</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRealTimeCoaching(!realTimeCoaching)}
                className={`p-2 rounded-lg transition-colors ${
                  realTimeCoaching 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title="Real-time coaching"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title="Auto-refresh recommendations"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Real-time Coaching Banner */}
      {realTimeCoaching && coachingTip && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 border-b border-green-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm flex-1">{coachingTip}</p>
              <button
                onClick={() => setRealTimeCoaching(false)}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'voice' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Voice Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'recommendations' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span>AI Recommendations</span>
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'habits' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Target className="w-5 h-5" />
            <span>Habit Tracker</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <VoiceAssistantRealTime 
                onTranscriptComplete={handleVoiceTranscript}
                className="mb-6"
              />
              
              {/* Quick Voice Commands */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Voice Commands</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Expense Tracking</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• "I spent $50 on groceries today"</li>
                      <li>• "Track $25 for lunch"</li>
                      <li>• "Add $100 for gas this week"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Financial Questions</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• "What's my budget for dining out?"</li>
                      <li>• "How can I save more money?"</li>
                      <li>• "Give me budgeting tips"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <AIRecommendationsEnhanced 
              autoRefresh={autoRefresh}
              refreshInterval={30000}
              className="mb-6"
            />
          )}

          {activeTab === 'habits' && (
            <HabitTracker />
          )}
        </div>

        {/* AI Stats Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Assistant Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{habits.filter(h => h.userId === user.id).length}</p>
              <p className="text-sm text-gray-600">Habits Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{realTimeCoaching ? 'Active' : 'Off'}</p>
              <p className="text-sm text-gray-600">Real-time Coaching</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{autoRefresh ? 'Auto' : 'Manual'}</p>
              <p className="text-sm text-gray-600">Recommendations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">Advanced</p>
              <p className="text-sm text-gray-600">AI Model</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <Target className="h-6 w-6" />
              <span className="text-xs">Transactions</span>
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="flex flex-col items-center space-y-1 text-purple-600"
            >
              <Brain className="h-6 w-6" />
              <span className="text-xs">AI</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-purple-600"
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}