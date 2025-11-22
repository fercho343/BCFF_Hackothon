import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, sessionChecked } = useAuthStore()
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Only check auth when session check is complete
    if (sessionChecked) {
      setCheckingAuth(false)
      
      if (!isAuthenticated) {
        toast.error('Please log in to access this page')
        navigate('/', { replace: true })
      }
    }
  }, [isAuthenticated, sessionChecked, navigate])

  // Show loading while checking session or if not authenticated but still checking
  if (isLoading || !sessionChecked || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Only render children if authenticated and session is checked
  return isAuthenticated ? <>{children}</> : null
}