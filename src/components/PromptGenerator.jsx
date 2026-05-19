import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle, Type, Palette, Copy, CheckCircle, ChevronDown, Monitor } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PromptGenerator({ prefill }) {
  const [topic, setTopic] = useState('')
  const [mood, setMood] = useState('')
  const [platform, setPlatform] = useState('general')
  const [platforms, setPlatforms] = useState([])
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const { logout } = useAuth()

  // Load platforms on mount
  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const res = await api.get('/platforms')
        setPlatforms(res.data)
      } catch (err) {
        console.error('Failed to load platforms', err)
        setPlatforms([
          { id: 'general', name: 'General / Universal' },
          { id: 'meta_ai', name: 'Meta AI (Imagine)' },
          { id: 'runway', name: 'Runway Gen-3' },
          { id: 'sora', name: 'OpenAI Sora' },
          { id: 'kling', name: 'Kling AI' },
          { id: 'pika', name: 'Pika Labs' },
          { id: 'midjourney', name: 'Midjourney' },
          { id: 'stable_diffusion', name: 'Stable Diffusion' }
        ])
      }
    }
    fetchPlatforms()
  }, [])

  // Apply prefill from TrendSection clicks
  useEffect(() => {
    if (prefill) {
      setTopic(prefill.topic || '')
      setMood(prefill.mood || '')
    }
  }, [prefill])

  async function generate() {
    if (!topic || !mood) {
      setError('Please provide both a topic and a mood.')
      return
    }

    setLoading(true)
    setError(null)
    setPrompts([])
    try {
      const res = await api.post('/generate', { topic, mood, platform, count: 5 })
      setPrompts(res.data.prompts)
    } catch (err) {
      console.error('Generation error:', err)
      if (err.response?.status === 401) {
        logout()
      } else {
        setError(err.response?.data?.error || 'Failed to generate prompts. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = () => {
    const allText = prompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n')
    navigator.clipboard.writeText(allText)
    setCopiedIdx('all')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const renderPromptText = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, index) => {
      const cleanedLine = line.trim()
      if (!cleanedLine) return <div key={index} className="h-2" />

      // Check if it's the storyboard header
      if (cleanedLine.startsWith('🎬') || cleanedLine.startsWith('**🎬')) {
        const titleText = cleanedLine.replace(/\*\*/g, '').trim()
        return (
          <h4 key={index} className="text-base font-bold text-accent flex items-center gap-2 mt-1 mb-4 bg-accent/10 py-2 px-4 rounded-xl border border-accent/20 shadow-sm">
            {titleText}
          </h4>
        )
      }

      // Check for storyboard metadata keys like **Visual Concept**: or **Camera Movement**:
      if (cleanedLine.startsWith('**') && cleanedLine.includes('**:')) {
        const parts = cleanedLine.split('**:')
        const header = parts[0].replace(/\*\*/g, '').trim()
        const content = parts.slice(1).join('**:').trim()
        return (
          <div key={index} className="mt-4 first:mt-0 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400/90 block mb-1">
              {header}
            </span>
            <p className="text-gray-200 text-sm leading-relaxed">{content}</p>
          </div>
        )
      }

      // Check for bullet timeline actions: - **[0:00 - 0:02]**: ... or * **[0:00 - 0:02]**: ...
      if (cleanedLine.startsWith('-') || cleanedLine.startsWith('*')) {
        let content = cleanedLine.substring(1).trim()
        if (content.startsWith('**') && content.includes('**:')) {
          const parts = content.split('**:')
          const time = parts[0].replace(/\*\*/g, '').replace(/\[|\]/g, '').trim()
          const action = parts.slice(1).join('**:').trim()
          return (
            <div key={index} className="flex items-start gap-3 pl-4 py-2 border-l-2 border-accent/30 hover:border-accent transition-colors my-2">
              <span className="shrink-0 text-xs font-mono font-bold bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/30">
                {time}
              </span>
              <p className="text-gray-300 text-sm leading-relaxed">{action}</p>
            </div>
          )
        }
      }

      // Default fallback
      return (
        <p key={index} className="text-gray-300 text-sm leading-relaxed my-1">
          {cleanedLine.replace(/\*\*/g, '')}
        </p>
      )
    })
  }

  const selectedPlatformName = platforms.find(p => p.id === platform)?.name || 'General'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8"
    >
      {/* Input Card */}
      <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-accent/20 text-accent shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AI Prompt Engine
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Generates 5 optimized storyboards per request</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Platform Selector */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
              <Monitor size={18} />
            </div>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner cursor-pointer"
            >
              {platforms.map(p => (
                <option key={p.id} value={p.id} className="bg-gray-900 text-white">{p.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={18} />
            </div>
          </div>

          {/* Topic Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
              <Type size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Describe your scene (e.g. Cyberpunk city at night)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Mood Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
              <Palette size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Set the mood (e.g. Neon-noir, moody, rainy)"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Generate Button */}
          <button 
            onClick={generate}
            disabled={loading || !topic || !mood}
            className="relative w-full py-4 px-6 rounded-xl bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 active:scale-[0.98] transition-all font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating 5 Storyboards for {selectedPlatformName}...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate 5 Storyboards for {selectedPlatformName}
              </>
            )}
          </button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Card */}
      <AnimatePresence>
        {(prompts.length > 0 || loading) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Generated Storyboards</h3>
                <p className="text-xs text-gray-500 mt-1">Optimized for {selectedPlatformName}</p>
              </div>
              {prompts.length > 1 && (
                <button 
                  onClick={copyAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors text-sm font-medium text-accent"
                >
                  {copiedIdx === 'all' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copiedIdx === 'all' ? 'All Copied!' : 'Copy All'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-sm font-medium text-accent animate-pulse">Crafting 5 storyboards...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {prompts.map((prompt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white text-sm font-bold mt-1 shadow-md">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          {renderPromptText(prompt)}
                        </div>
                        <div className="flex justify-end mt-4 pt-3 border-t border-white/5">
                          <button 
                            onClick={() => copyToClipboard(prompt, idx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-colors text-xs font-medium text-gray-400 hover:text-white"
                          >
                            {copiedIdx === idx ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                            {copiedIdx === idx ? 'Copied Storyboard!' : 'Copy Storyboard'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
