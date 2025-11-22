import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  full_name: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionChecked: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setSessionChecked: (checked: boolean) => void
  logout: () => void
  initializeSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionChecked: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSessionChecked: (checked) => set({ sessionChecked: checked }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      }),
      
      initializeSession: async () => {
        const { setUser, setLoading, setSessionChecked } = get()
        
        try {
          setLoading(true)
          
          // Check if we're in development mode without proper Supabase setup
          const isSupabaseConfigured = () => {
            const url = import.meta.env.VITE_SUPABASE_URL
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY
            return url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder-key'
          }
          
          if (!isSupabaseConfigured()) {
            // For development mode, check if we have a persisted mock user
            const { user } = get()
            if (user) {
              setUser(user)
            }
            setSessionChecked(true)
            setLoading(false)
            return
          }
          
          // Dynamic import to avoid circular dependencies
          const { supabase } = await import('@/lib/supabase')
          
          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || session.user.email!
            })
          } else {
            // No valid session found
            setUser(null)
          }
          
          setSessionChecked(true)
        } catch (error) {
          console.error('Error initializing session:', error)
          setUser(null)
          setSessionChecked(true)
        } finally {
          setLoading(false)
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)