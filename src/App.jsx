import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import AuthPage from './pages/AuthPage'
import SettingsPage from './pages/SettingsPage'
import AdminPanel from './pages/AdminPanel'
import Navbar from './components/Navbar'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return children
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Hidden admin panel — no Navbar, completely separate */}
            <Route path="/admin-x9k2" element={<AdminPanel />} />

            {/* Regular app routes with Navbar */}
            <Route path="*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

