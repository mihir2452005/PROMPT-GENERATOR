import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle, Type, Palette, Copy, CheckCircle } from 'lucide-react'
import api from '../services/api'

export default function PromptGenerator() {
  const [topic, setTopic] = useState('')
  const [mood, setMood] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!topic || !mood) {
      setError('Please provide both a topic and a mood.')
      return
    }

    setLoading(true)
    setError(null)
    setPrompt('')
    try {
      const res = await api.post('/generate', { topic, mood })
      setPrompt(res.data.prompt)
    } catch (err) {
      console.error('Generation error:', err)
      setError('Failed to generate prompt. Please check your backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-8"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-accent/20 text-accent shadow-[0_0_15px_rgba(124,58,237,0.5)]">
          <Sparkles size={24} />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          AI Prompt Engine
        </h2>
      </div>

      <div className="space-y-5">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Type size={18} />
          </div>
          <input 
            type="text" 
            placeholder="What is your topic? (e.g. Cyberpunk city)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner"
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Palette size={18} />
          </div>
          <input 
            type="text" 
            placeholder="What is the mood? (e.g. Neon, moody, rainy)"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner"
          />
        </div>

        <button 
          onClick={generate}
          disabled={loading || !topic || !mood}
          className="relative w-full py-4 px-6 rounded-xl bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 active:scale-[0.98] transition-all font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Magic...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Cinematic Prompt
            </>
          )}
        </button>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Resulting Prompt</h3>
        <div className="p-6 rounded-2xl bg-black/60 border border-white/5 text-gray-200 min-h-[140px] relative group shadow-inner">
          {prompt ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col h-full"
            >
              <p className="leading-relaxed text-lg flex-1">{prompt}</p>
              <div className="flex justify-end mt-4">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 italic">
              Your cinematic prompt will appear here...
            </div>
          )}
          
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl z-10"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-accent animate-pulse">Crafting pixels...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
