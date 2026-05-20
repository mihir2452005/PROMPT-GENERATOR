import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, ArrowRight, Clock, Sparkles } from 'lucide-react'
import api from '../services/api'

export default function HistorySection({ onSelectQuery, refreshTrigger }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/history')
      setHistory(res.data)
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger])

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all search history?')) return
    try {
      await api.delete('/history')
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history', err)
    }
  }

  const deleteHistoryItem = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/history/${id}`)
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to delete history item', err)
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
            <History size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Search History</h3>
            <p className="text-[10px] text-gray-500">Your recent storyboard query designs</p>
          </div>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            title="Clear all history"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {loading && history.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <Clock className="text-gray-600" size={32} />
          <p className="text-xs text-gray-500">No recent searches yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectQuery({ topic: item.topic, mood: item.mood, platform: item.platform })}
                className="group flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {item.platform || 'general'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                    {item.topic}
                  </h4>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    Mood: {item.mood}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete this query"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-accent/20 transition-all">
                    <ArrowRight size={12} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
