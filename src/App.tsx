import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import LandingPage from '@/pages/LandingPage'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Analytics from '@/pages/Analytics'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Check if we're in development mode without proper Supabase setup
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder-key'
}

export default function App() {
  const { setUser, user } = useAuthStore()
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!isConfigured) {
      // Mock authentication for development
      console.log('Running in mock mode - Supabase not configured')
      return
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.email!
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || session.user.email!
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, isConfigured])

  return (
    <>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}
