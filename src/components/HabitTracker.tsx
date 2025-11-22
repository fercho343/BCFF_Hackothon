import { useState } from 'react';
import { useFinancialHabitsStore, FinancialHabit } from '@/stores/financialHabitsStore';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit2, Trash2, TrendingUp, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface HabitTrackerProps {
  className?: string;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  className = '' 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { habits, addHabit, updateHabit, deleteHabit, getSpendingInsights } = useFinancialHabitsStore();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    description: '',
    isRecurring: false
  });

  const insights = getSpendingInsights();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to track habits');
      return;
    }

    if (!formData.category || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const habitData = {
      userId: user.id,
      category: formData.category,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      description: formData.description,
      isRecurring: formData.isRecurring
    };

    if (editingId) {
      updateHabit(editingId, habitData);
      toast.success('Habit updated successfully');
      setEditingId(null);
    } else {
      addHabit(habitData);
      toast.success('Habit added successfully');
    }

    setFormData({
      category: '',
      amount: '',
      frequency: 'daily',
      description: '',
      isRecurring: false
    });
    setShowAddForm(false);
  };

  const handleEdit = (habit: FinancialHabit) => {
    setFormData({
      category: habit.category,
      amount: habit.amount.toString(),
      frequency: habit.frequency,
      description: habit.description,
      isRecurring: habit.isRecurring
    });
    setEditingId(habit.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabit(id);
      toast.success('Habit deleted successfully');
    }
  };

  const userHabits = habits.filter((h) => h.userId === user?.id);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Financial Habit Tracker</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Spending Insights */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Spending Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              ${insights.averageDailySpending.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Avg Daily Spending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${insights.totalRecurring.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Monthly Recurring</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">
              {insights.topCategories.length}
            </p>
            <p className="text-sm text-gray-600">Top Categories</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Coffee, Dining, Shopping"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Recurring expense
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingId ? 'Update' : 'Add'} Habit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({
                  category: '',
                  amount: '',
                  frequency: 'daily',
                  description: '',
                  isRecurring: false
                });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {userHabits.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No habits tracked yet. Add your first financial habit to start tracking your spending patterns!
            </p>
          </div>
        ) : (
          userHabits.map((habit) => (
            <div key={habit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-800">{habit.category}</h4>
                    {habit.isRecurring && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Recurring
                      </span>
                    )}
                    <span className="text-sm text-gray-500 capitalize">
                      {habit.frequency}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${habit.amount.toFixed(2)}
                  </p>
                  {habit.description && (
                    <p className="text-gray-600 text-sm mt-1">{habit.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(habit.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(habit)}
                    className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Suggestions
          </h4>
          <ul className="space-y-1">
            {insights.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};