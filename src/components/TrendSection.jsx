import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight, Zap, Image as ImageIcon } from 'lucide-react'
import api from '../services/api'

export default function TrendSection() {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await api.get('/trends')
        setTrends(res.data)
      } catch (err) {
        console.error('Failed to fetch trends', err)
        // Fallback trends if backend fails
        setTrends([
          { title: 'Cyberpunk Cityscapes', icon: 'Zap' },
          { title: 'Ethereal Fantasy', icon: 'ImageIcon' },
          { title: 'Neon Noir', icon: 'TrendingUp' }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <TrendingUp size={24} />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Trending Styles
        </h2>
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
          className="space-y-4 flex-1 flex flex-col justify-center"
        >
          {trends.map((t, idx) => (
            <motion.div 
              key={idx}
              variants={item}
              whileHover={{ scale: 1.02, x: 5 }}
              className="group cursor-pointer p-5 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between shadow-inner"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <span className="text-sm font-bold">{idx + 1}</span>
                </div>
                <span className="font-medium text-lg text-gray-200 group-hover:text-white transition-colors">
                  {t.title}
                </span>
              </div>
              <ArrowRight size={18} className="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-4 group-hover:translate-x-0" />
            </motion.div>
          ))}
        </motion.div>
      )}
      
      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-gray-500">Updated hourly based on community generations</p>
      </div>
    </motion.div>
  )
}
