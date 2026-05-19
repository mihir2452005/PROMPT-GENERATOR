import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Type, Palette, Copy, CheckCircle, ChevronDown, Monitor, Star } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PromptGenerator({ prefill, onGenerateSuccess, onFavoritesChange, favoritesRefreshTrigger }) {
  const [topic, setTopic] = useState('')
  const [mood, setMood] = useState('')
  const [platform, setPlatform] = useState('general')
  const [platforms, setPlatforms] = useState([])
  const [prompts, setPrompts] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [favoritingIdx, setFavoritingIdx] = useState(null)
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
          { id: 'general', name: 'General Video' },
          { id: 'meta_ai', name: 'Meta AI (Imagine)' },
          { id: 'runway', name: 'Runway Gen-3' },
          { id: 'sora', name: 'OpenAI Sora' },
          { id: 'kling', name: 'Kling AI' },
          { id: 'pika', name: 'Pika Labs' },
          { id: 'luma', name: 'Luma Dream Machine' },
          { id: 'haiper', name: 'Haiper AI' }
        ])
      }
    }
    fetchPlatforms()
  }, [])

  // Load favorites to check matching status
  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites')
      setFavorites(res.data)
    } catch (err) {
      console.error('Failed to sync favorites in generator', err)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [favoritesRefreshTrigger])

  // Apply prefill from TrendSection or HistorySection clicks
  useEffect(() => {
    if (prefill) {
      setTopic(prefill.topic || '')
      setMood(prefill.mood || '')
      if (prefill.platform) {
        setPlatform(prefill.platform)
      }
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
      
      // Sync list state of search history and favorites
      if (onGenerateSuccess) {
        onGenerateSuccess()
      }
      fetchFavorites()
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

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(key)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = () => {
    const allText = prompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n')
    navigator.clipboard.writeText(allText)
    setCopiedIdx('all')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // Toggle favorite status on/off
  const toggleFavorite = async (promptText, idx) => {
    setFavoritingIdx(idx)
    try {
      const match = favorites.find(f => f.content === promptText)
      if (match) {
        // Remove from favorites
        await api.delete(`/favorites/${match.id}`)
        setFavorites(favorites.filter(f => f.id !== match.id))
      } else {
        // Add to favorites
        const res = await api.post('/favorites', {
          topic,
          mood,
          platform,
          content: promptText
        })
        setFavorites([...favorites, res.data.favorite])
      }
      
      // Trigger sidebar update
      if (onFavoritesChange) {
        onFavoritesChange()
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    } finally {
      setFavoritingIdx(null)
    }
  }

  const [showMetaAICopilot, setShowMetaAICopilot] = useState(false)
  const [copilotPromptText, setCopilotPromptText] = useState('')
  const [copilotClipName, setCopilotClipName] = useState('')
  const [copilotPart, setCopilotPart] = useState(1)

  const handleLaunchMetaAICopilot = (promptText, clipName, partNum, shouldOpenTab) => {
    navigator.clipboard.writeText(promptText)
    setCopilotPromptText(promptText)
    setCopilotClipName(clipName)
    setCopilotPart(partNum)
    setShowMetaAICopilot(true)
    if (shouldOpenTab) {
      window.open('https://meta.ai', '_blank')
    }
  }



  const parseStoryboardText = (text) => {
    if (!text) return null
    
    let title = "Storyboard Sequence"
    const titleMatch = text.match(/🎬\s*\*\*Storyboard:\s*(.*?)\*\*/i) || text.match(/🎬\s*Storyboard:\s*(.*?)(?:\n|$)/i)
    if (titleMatch) title = titleMatch[1].trim()

    let visualConcept = ""
    const conceptMatch = text.match(/\*\*Visual Concept\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/Visual Concept:\s*(.*?)(?=\n|$)/i)
    if (conceptMatch) visualConcept = conceptMatch[1].trim()

    let cameraTrajectory = ""
    const cameraMatch = text.match(/\*\*Camera Trajectory\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/\*\*Camera Movement\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/Camera Trajectory:\s*(.*?)(?=\n|$)/i)
    if (cameraMatch) cameraTrajectory = cameraMatch[1].trim()

    let part1Action = ""
    let part1Camera = ""
    let part1Prompt = ""
    const part1BlockMatch = text.match(/\*\*Part 1 Video Prompt.*?\*\*.*?:?\s*([\s\S]*?)(?=\*\*Part 2|$)/i) || text.match(/Part 1 Video Prompt.*?:?\s*([\s\S]*?)(?=Part 2|$)/i)
    if (part1BlockMatch) {
      const block = part1BlockMatch[1]
      const actionM = block.match(/-\s*\*\*Action\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*Action:\s*(.*?)(?:\n|$)/i)
      const cameraM = block.match(/-\s*\*\*Camera\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*Camera:\s*(.*?)(?:\n|$)/i)
      const promptM = block.match(/-\s*\*\*.*Prompt\*\*:\s*`(.*?)`/i) || block.match(/-\s*\*\*.*Prompt\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*.*Prompt:\s*`(.*?)`/i) || block.match(/-\s*.*Prompt:\s*(.*?)(?:\n|$)/i)
      if (actionM) part1Action = actionM[1].trim()
      if (cameraM) part1Camera = cameraM[1].trim()
      if (promptM) part1Prompt = promptM[1].trim()
    }

    let part2Action = ""
    let part2Camera = ""
    let part2Prompt = ""
    const part2BlockMatch = text.match(/\*\*Part 2 Video Prompt.*?\*\*.*?:?\s*([\s\S]*?)(?=\*\*Fluid|$)/i) || text.match(/Part 2 Video Prompt.*?:?\s*([\s\S]*?)(?=Fluid|$)/i)
    if (part2BlockMatch) {
      const block = part2BlockMatch[1]
      const actionM = block.match(/-\s*\*\*Action\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*Action:\s*(.*?)(?:\n|$)/i)
      const cameraM = block.match(/-\s*\*\*Camera\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*Camera:\s*(.*?)(?:\n|$)/i)
      const promptM = block.match(/-\s*\*\*.*Prompt\*\*:\s*`(.*?)`/i) || block.match(/-\s*\*\*.*Prompt\*\*:\s*(.*?)(?:\n|$)/i) || block.match(/-\s*.*Prompt:\s*`(.*?)`/i) || block.match(/-\s*.*Prompt:\s*(.*?)(?:\n|$)/i)
      if (actionM) part2Action = actionM[1].trim()
      if (cameraM) part2Camera = cameraM[1].trim()
      if (promptM) part2Prompt = promptM[1].trim()
    }

    let fluidEffects = ""
    const fluidMatch = text.match(/\*\*Fluid Effects\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/\*\*Special Animation Features\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/Fluid Effects:\s*(.*?)(?=\n|$)/i)
    if (fluidMatch) fluidEffects = fluidMatch[1].trim()

    return {
      title,
      visualConcept,
      cameraTrajectory,
      part1: { action: part1Action, camera: part1Camera, prompt: part1Prompt },
      part2: { action: part2Action, camera: part2Camera, prompt: part2Prompt },
      fluidEffects
    }
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
            <p className="text-xs text-gray-500 mt-0.5">Generates 5 continuous multi-part storyboards</p>
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
                <p className="text-xs text-gray-500 mt-1">Multi-part prompts for {selectedPlatformName}</p>
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
                {prompts.map((prompt, idx) => {
                  const data = parseStoryboardText(prompt)
                  const isFavorited = favorites.some(f => f.content === prompt)
                  const keyPrefix = `prompt-${idx}`
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="group p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all shadow-xl flex flex-col gap-4 relative"
                    >
                      {/* Top Bar inside Card */}
                      <div className="flex items-start justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {idx + 1}
                          </div>
                          <h4 className="text-base font-bold text-accent">
                            {data?.title || 'Storyboard Sequence'}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(prompt, idx)}
                            disabled={favoritingIdx === idx}
                            className={`p-2 rounded-xl border transition-all ${
                              isFavorited 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' 
                                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                            }`}
                            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
                          >
                            <Star size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                          </button>
                          
                          <button 
                            onClick={() => copyToClipboard(prompt, `${keyPrefix}-full`)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-400 hover:text-white transition-all"
                            title="Copy full storyboard script"
                          >
                            {copiedIdx === `${keyPrefix}-full` ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                            {copiedIdx === `${keyPrefix}-full` ? 'Copied Script!' : 'Copy Script'}
                          </button>
                        </div>
                      </div>

                      {/* Decoded Content Layout */}
                      {data ? (
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/90 block mb-1">
                              Visual Concept
                            </span>
                            <p className="text-sm text-gray-200 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5">
                              {data.visualConcept}
                            </p>
                          </div>

                          {data.cameraTrajectory && (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Trajectory:</span>
                              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                                {data.cameraTrajectory}
                              </span>
                            </div>
                          )}

                          {/* Dual Part Sequential Columns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Part 1 */}
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col justify-between gap-3">
                              <div>
                                <span className="text-xs font-bold text-accent">Part 1 (0s - 5s)</span>
                                <div className="space-y-2 mt-2">
                                  {data.part1.action && (
                                    <div>
                                      <span className="text-[9px] text-gray-500 uppercase">Action</span>
                                      <p className="text-xs text-gray-300 mt-0.5">{data.part1.action}</p>
                                    </div>
                                  )}
                                  {data.part1.camera && (
                                    <div>
                                      <span className="text-[9px] text-gray-500 uppercase">Camera</span>
                                      <p className="text-xs text-gray-300 mt-0.5">{data.part1.camera}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {data.part1.prompt && (
                                <div className="flex flex-col gap-2 w-full">
                                  <button
                                    onClick={() => copyToClipboard(data.part1.prompt, `${keyPrefix}-part1`)}
                                    className="w-full py-2 px-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-accent/20"
                                  >
                                    {copiedIdx === `${keyPrefix}-part1` ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                                    {copiedIdx === `${keyPrefix}-part1` ? 'Copied Prompt 1!' : 'Copy Clip 1 Prompt'}
                                  </button>

                                  {/* Compile with Meta AI Button */}
                                  <button
                                    onClick={() => handleLaunchMetaAICopilot(data.part1.prompt, "Clip 1", 1, true)}
                                    className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 hover:from-blue-500/50 hover:via-purple-500/50 hover:to-pink-500/50 text-white hover:text-cyan-200 transition-all text-xs font-extrabold flex items-center justify-center gap-2 border border-purple-500/40 shadow-lg shadow-purple-500/10 mt-1"
                                  >
                                    <Sparkles size={14} className="text-purple-300 animate-pulse" />
                                    Compile with Meta AI (Free)
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Part 2 */}
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-green-400">Part 2 (5s - 10s)</span>
                                  <span className="text-[9px] bg-green-500/10 text-green-400 px-1 py-0.5 rounded border border-green-500/20">Seamless Continuation</span>
                                </div>
                                <div className="space-y-2 mt-2">
                                  {data.part2.action && (
                                    <div>
                                      <span className="text-[9px] text-gray-500 uppercase">Action</span>
                                      <p className="text-xs text-gray-300 mt-0.5">{data.part2.action}</p>
                                    </div>
                                  )}
                                  {data.part2.camera && (
                                    <div>
                                      <span className="text-[9px] text-gray-500 uppercase">Camera</span>
                                      <p className="text-xs text-gray-300 mt-0.5">{data.part2.camera}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {data.part2.prompt && (
                                <div className="flex flex-col gap-2 w-full">
                                  <button
                                    onClick={() => copyToClipboard(data.part2.prompt, `${keyPrefix}-part2`)}
                                    className="w-full py-2 px-3 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-400 transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-green-500/20"
                                  >
                                    {copiedIdx === `${keyPrefix}-part2` ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                                    {copiedIdx === `${keyPrefix}-part2` ? 'Copied Prompt 2!' : 'Copy Clip 2 Prompt'}
                                  </button>

                                  {/* Compile with Meta AI Button */}
                                  <button
                                    onClick={() => handleLaunchMetaAICopilot(data.part2.prompt, "Clip 2", 2, false)}
                                    className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 hover:from-blue-500/50 hover:via-purple-500/50 hover:to-pink-500/50 text-white hover:text-cyan-200 transition-all text-xs font-extrabold flex items-center justify-center gap-2 border border-purple-500/40 shadow-lg shadow-purple-500/10 mt-1"
                                  >
                                    <Sparkles size={14} className="text-purple-300 animate-pulse" />
                                    Compile with Meta AI (Free)
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {data.fluidEffects && (
                            <div>
                              <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Fluid Animation:</span>
                              <p className="text-xs text-gray-400 mt-0.5">{data.fluidEffects}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Fallback line rendering
                        <div className="space-y-1">
                          {prompt.split('\n').map((line, lIdx) => (
                            <p key={lIdx} className="text-gray-300 text-sm leading-relaxed">{line}</p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta AI Co-Pilot Panel */}
      <AnimatePresence>
        {showMetaAICopilot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Glow effects */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Pulsing Meta AI Logo/Ring */}
              <div className="flex flex-col items-center text-center mt-2 mb-6">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 animate-[spin_8s_linear_infinite] mb-4 shadow-lg shadow-purple-500/20">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <Sparkles size={24} className="text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-pink-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">Meta AI Co-Pilot Active</h3>
                <p className="text-xs text-gray-400 mt-1">Generating free high-definition video for {copilotClipName}</p>
              </div>

              {/* Step List */}
              <div className="space-y-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {copilotPart === 1 ? 'Prompt 1 Copied to Clipboard! 📋' : 'Prompt 2 Copied to Clipboard! 📋'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {copilotPart === 1 
                        ? 'Your optimized storyboard prompt has been automatically copied.' 
                        : 'Your seamless sequence continuation prompt has been copied.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {copilotPart === 1 ? 'Meta AI Web Opened 🚀' : 'Switch to Open Chat Tab 🔗'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {copilotPart === 1 
                        ? 'We opened `meta.ai` in a separate tab or window for you.' 
                        : 'Simply switch back to your existing Meta AI tab where Clip 1 was generated.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {copilotPart === 1 ? 'Paste & Compile (Free) 🎬' : 'Paste to Continue Sequence 🔄'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {copilotPart === 1 
                        ? 'Right-click the Meta AI text input, choose Paste (Ctrl+V), and hit Enter to generate beautiful animations instantly!' 
                        : 'Paste (Ctrl+V) directly into the same chat thread to continue the previous video sequence seamlessly!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open('https://meta.ai', '_blank')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10 flex items-center justify-center gap-1.5"
                >
                  Re-open Meta AI
                </button>
                <button
                  onClick={() => setShowMetaAICopilot(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center"
                >
                  Done, I'm Back!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
