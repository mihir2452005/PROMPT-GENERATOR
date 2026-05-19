import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, History, Star, LogOut } from 'lucide-react'
import PromptGenerator from '../components/PromptGenerator'
import TrendSection from '../components/TrendSection'
import HistorySection from '../components/HistorySection'
import FavoritesSection from '../components/FavoritesSection'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const [prefill, setPrefill] = useState(null)
  const [activeTab, setActiveTab] = useState('trends') // 'trends' | 'history' | 'favorites'
  
  // Real-time reactive state synchronization triggers
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0)
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0)
  
  const { logout } = useAuth()

  const handleGenerateSuccess = () => {
    // Increment search history refresh trigger
    setHistoryRefreshTrigger(prev => prev + 1)
  }

  const handleFavoritesChange = () => {
    // Increment favorites refresh trigger (generator saved/removed -> sidebar updates)
    setFavoritesRefreshTrigger(prev => prev + 1)
  }

  const handleUnfavoriteFromSidebar = () => {
    // Increment favorites refresh trigger (sidebar deleted -> generator matches update)
    setFavoritesRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-midnight text-white overflow-x-hidden selection:bg-accent selection:text-white">
      {/* Animated Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-12 flex flex-col">

        {/* Dashboard Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 bg-gradient-to-r from-white via-accent to-blue-400 bg-clip-text text-transparent">
            MetaPrompt Studio
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Craft high-fidelity multi-part cinematic prompts. Seamlessly split narratives into perfectly stitched 5-second video sequences.
          </p>
        </motion.div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          {/* Left Column: Prompt Generator */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <PromptGenerator 
              prefill={prefill} 
              onGenerateSuccess={handleGenerateSuccess}
              onFavoritesChange={handleFavoritesChange}
              favoritesRefreshTrigger={favoritesRefreshTrigger}
            />
          </motion.div>
          
          {/* Right Column: Tabbed Widget Board */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5 flex flex-col gap-6"
          >
            {/* Elegant Glassmorphic Tab Controller */}
            <div className="flex p-1 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'trends'
                    ? 'bg-accent text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame size={14} />
                Trending
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-accent text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <History size={14} />
                History
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'favorites'
                    ? 'bg-accent text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Star size={14} />
                Favorites
              </button>
            </div>

            {/* Render Selected Sidebar Widget */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {activeTab === 'trends' && (
                  <motion.div
                    key="trends"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrendSection onTrendClick={setPrefill} />
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HistorySection 
                      onSelectQuery={setPrefill} 
                      refreshTrigger={historyRefreshTrigger} 
                    />
                  </motion.div>
                )}

                {activeTab === 'favorites' && (
                  <motion.div
                    key="favorites"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FavoritesSection 
                      refreshTrigger={favoritesRefreshTrigger} 
                      onUnfavoriteCallback={handleUnfavoriteFromSidebar} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
