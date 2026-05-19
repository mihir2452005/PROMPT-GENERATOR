import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trash2, Copy, CheckCircle, ExternalLink, X, Film } from 'lucide-react'
import api from '../services/api'

export default function FavoritesSection({ refreshTrigger, onUnfavoriteCallback }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFav, setSelectedFav] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const res = await api.get('/favorites')
      setFavorites(res.data)
    } catch (err) {
      console.error('Failed to load favorites', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [refreshTrigger])

  const deleteFav = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Remove this storyboard from your favorites?')) return
    try {
      await api.delete(`/favorites/${id}`)
      setFavorites(favorites.filter(f => f.id !== id))
      if (selectedFav && selectedFav.id === id) {
        setSelectedFav(null)
      }
      if (onUnfavoriteCallback) {
        onUnfavoriteCallback(id)
      }
    } catch (err) {
      console.error('Failed to delete favorite', err)
    }
  }

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(key)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // Parse multi-part continuous prompts beautifully
  const parseStoryboardText = (text) => {
    if (!text) return null
    
    let title = "Storyboard Sequence"
    const titleMatch = text.match(/🎬\s*\*\*Storyboard:\s*(.*?)\*\*/i) || text.match(/🎬\s*Storyboard:\s*(.*?)\n/i)
    if (titleMatch) title = titleMatch[1].trim()

    let visualConcept = ""
    const conceptMatch = text.match(/\*\*Visual Concept\*\*:\s*(.*?)(?=\n\*\*|$)/i)
    if (conceptMatch) visualConcept = conceptMatch[1].trim()

    let cameraTrajectory = ""
    const cameraMatch = text.match(/\*\*Camera Trajectory\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/\*\*Camera Movement\*\*:\s*(.*?)(?=\n\*\*|$)/i)
    if (cameraMatch) cameraTrajectory = cameraMatch[1].trim()

    let part1Action = ""
    let part1Camera = ""
    let part1Prompt = ""
    const part1BlockMatch = text.match(/\*\*Part 1 Video Prompt.*?\*\*:\s*([\s\S]*?)(?=\*\*Part 2|$)/i)
    if (part1BlockMatch) {
      const block = part1BlockMatch[1]
      const actionM = block.match(/-\s*\*\*Action\*\*:\s*(.*?)\n/i)
      const cameraM = block.match(/-\s*\*\*Camera\*\*:\s*(.*?)\n/i)
      const promptM = block.match(/-\s*\*\*.*Prompt\*\*:\s*`(.*?)`/i) || block.match(/-\s*\*\*.*Prompt\*\*:\s*(.*?)(?=\n|$)/i)
      if (actionM) part1Action = actionM[1].trim()
      if (cameraM) part1Camera = cameraM[1].trim()
      if (promptM) part1Prompt = promptM[1].trim()
    }

    let part2Action = ""
    let part2Camera = ""
    let part2Prompt = ""
    const part2BlockMatch = text.match(/\*\*Part 2 Video Prompt.*?\*\*:\s*([\s\S]*?)(?=\*\*Fluid|$)/i)
    if (part2BlockMatch) {
      const block = part2BlockMatch[1]
      const actionM = block.match(/-\s*\*\*Action\*\*:\s*(.*?)\n/i)
      const cameraM = block.match(/-\s*\*\*Camera\*\*:\s*(.*?)\n/i)
      const promptM = block.match(/-\s*\*\*.*Prompt\*\*:\s*`(.*?)`/i) || block.match(/-\s*\*\*.*Prompt\*\*:\s*(.*?)(?=\n|$)/i)
      if (actionM) part2Action = actionM[1].trim()
      if (cameraM) part2Camera = cameraM[1].trim()
      if (promptM) part2Prompt = promptM[1].trim()
    }

    let fluidEffects = ""
    const fluidMatch = text.match(/\*\*Fluid Effects\*\*:\s*(.*?)(?=\n\*\*|$)/i) || text.match(/\*\*Special Animation Features\*\*:\s*(.*?)(?=\n\*\*|$)/i)
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

  return (
    <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
          <Star size={18} fill="currentColor" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Favorite Collection</h3>
          <p className="text-[10px] text-gray-500">Your saved storyboard narratives</p>
        </div>
      </div>

      {loading && favorites.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <Star className="text-gray-600" size={32} />
          <p className="text-xs text-gray-500 font-medium">No favorites saved yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {favorites.map((fav) => {
              const details = parseStoryboardText(fav.content)
              return (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setSelectedFav(fav)}
                  className="group flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">
                        {fav.platform || 'general'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(fav.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-200 truncate group-hover:text-yellow-400 transition-colors">
                      {details?.title || fav.topic || 'Saved Sequence'}
                    </h4>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      Topic: {fav.topic}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => deleteFav(fav.id, e)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete favorite"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-yellow-400 group-hover:bg-yellow-500/10 transition-all">
                      <ExternalLink size={12} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Storyboard Detail Modal */}
      <AnimatePresence>
        {selectedFav && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-midnight border border-white/10 rounded-3xl p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedFav(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400">
                  <Film size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                      {selectedFav.platform || 'general'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mt-1">
                    {parseStoryboardText(selectedFav.content)?.title || 'Saved Sequence'}
                  </h2>
                </div>
              </div>

              {/* Content Panel */}
              {(() => {
                const data = parseStoryboardText(selectedFav.content)
                if (!data) return <p className="text-gray-400 text-sm">Failed to parse storyboard details.</p>
                return (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/90 block mb-1">
                        Visual Concept
                      </span>
                      <p className="text-sm text-gray-200 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                        {data.visualConcept}
                      </p>
                    </div>

                    {data.cameraTrajectory && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1.5">
                          Camera Trajectory
                        </span>
                        <span className="inline-block text-xs font-semibold bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20">
                          {data.cameraTrajectory}
                        </span>
                      </div>
                    )}

                    {/* Sequential Multi-Part Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Part 1 */}
                      <div className="p-5 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-accent">Part 1 (0s - 5s)</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Action</span>
                              <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{data.part1.action || 'Opening scene action details'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Camera Movement</span>
                              <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{data.part1.camera || 'Establishing shot panning'}</p>
                            </div>
                          </div>
                        </div>
                        {data.part1.prompt && (
                          <button
                            onClick={() => copyToClipboard(data.part1.prompt, 'part1')}
                            className="w-full py-2.5 px-4 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent transition-all text-xs font-bold flex items-center justify-center gap-2 border border-accent/20"
                          >
                            {copiedIdx === 'part1' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                            {copiedIdx === 'part1' ? 'Copied Prompt 1!' : 'Copy Clip 1 Prompt'}
                          </button>
                        )}
                      </div>

                      {/* Part 2 */}
                      <div className="p-5 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-green-400">Part 2 (5s - 10s)</span>
                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">Seamless Continuation</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Action</span>
                              <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{data.part2.action || 'Seamless sequential evolution'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Camera Movement</span>
                              <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{data.part2.camera || 'Continuous camera flow'}</p>
                            </div>
                          </div>
                        </div>
                        {data.part2.prompt && (
                          <button
                            onClick={() => copyToClipboard(data.part2.prompt, 'part2')}
                            className="w-full py-2.5 px-4 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-all text-xs font-bold flex items-center justify-center gap-2 border border-green-500/20"
                          >
                            {copiedIdx === 'part2' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                            {copiedIdx === 'part2' ? 'Copied Prompt 2!' : 'Copy Clip 2 Prompt'}
                          </button>
                        )}
                      </div>
                    </div>

                    {data.fluidEffects && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 block mb-1">
                          Fluid Animation Effects
                        </span>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {data.fluidEffects}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                      <span>Saved on {new Date(selectedFav.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => { deleteFav(selectedFav.id, e); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/20 transition-all text-red-400"
                      >
                        <Trash2 size={13} />
                        Delete from Favorites
                      </button>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
