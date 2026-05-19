import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'
import api from '../services/api'

export default function TrendSection({ onTrendClick }) {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await api.get('/trends')
        setTrends(res.data)
      } catch (err) {
        console.error('Failed to fetch trends', err)
        setTrends([
          { title: 'Cyberpunk Cityscape', topic: 'neon-lit cyberpunk city at night', mood: 'futuristic, neon-noir' },
          { title: 'Ethereal Fantasy', topic: 'magical enchanted forest with glowing particles', mood: 'mystical, dreamy' },
          { title: 'Ocean Sunset', topic: 'golden sunset over calm ocean waves', mood: 'peaceful, cinematic' }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  }

  const handleClick = (trend) => {
    if (onTrendClick) {
      onTrendClick({ topic: trend.topic, mood: trend.mood })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Trending Styles
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Click to auto-fill the generator</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3 flex-1"
        >
          {trends.map((t, idx) => (
            <motion.button 
              key={idx}
              variants={item}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(t)}
              className="group w-full text-left p-4 rounded-2xl bg-black/40 border border-white/5 hover:bg-accent/10 hover:border-accent/30 transition-all flex items-center justify-between shadow-inner"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-accent group-hover:bg-accent/10 transition-colors text-sm font-bold">
                  {idx + 1}
                </div>
                <div>
                  <span className="font-medium text-gray-200 group-hover:text-white transition-colors block">
                    {t.title}
                  </span>
                  <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                    {t.mood}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-600 group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
            </motion.button>
          ))}
        </motion.div>
      )}
      
      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-600">Click any trend to auto-fill your prompt</p>
      </div>
    </motion.div>
  )
}
