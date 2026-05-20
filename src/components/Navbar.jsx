import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Don't render any auth-related nav buttons on the auth page itself
  const isAuthPage = location.pathname === '/auth'

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — always visible, links to home if authenticated else to auth */}
        <Link
          to={isAuthenticated ? '/' : '/auth'}
          className="flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-lg bg-accent/20 text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-[0_0_10px_rgba(124,58,237,0.3)]">
            <Sparkles size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:to-white transition-all">
            MetaPrompt
          </span>
        </Link>

        {/* Right side — hidden entirely on the auth page */}
        {!isAuthPage && (
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-gray-400 hover:text-white"
                  title="Settings"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-gray-300 hover:text-white"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.nav>
  )
}
