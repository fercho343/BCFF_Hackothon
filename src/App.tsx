import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your session...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { initializeSession, isLoading, sessionChecked, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Initialize session on app mount
    initializeSession()
  }, [initializeSession])

  // Show loading screen while checking session
  if (isLoading || !sessionChecked) {
    return (
      <>
        <LoadingScreen />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
              } 
            />
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