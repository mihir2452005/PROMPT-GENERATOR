import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Save, Trash2, CheckCircle, AlertCircle, Loader2, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await api.get('/settings/api-key')
        setHasKey(res.data.has_key)
        setSavedKey(res.data.openai_key || '')
      } catch (e) {
        console.error('Failed to fetch key status', e)
      } finally {
        setLoading(false)
      }
    }
    fetchKey()
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter a valid API key.', 'error')
      return
    }
    if (!apiKey.startsWith('sk-')) {
      showToast('Key must start with "sk-". Please check your key.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post('/settings/api-key', { openai_key: apiKey.trim() })
      setHasKey(true)
      setSavedKey(`${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)
      setApiKey('')
      showToast('API Key saved successfully! Your prompts will now use your personal key.', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save key. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await api.post('/settings/api-key', { openai_key: null })
      setHasKey(false)
      setSavedKey('')
      setApiKey('')
      showToast('API Key removed. We\'ll use our free fallback generator instead.', 'success')
    } catch (err) {
      showToast('Failed to remove key. Please try again.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight text-white pt-24 px-6 pb-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-400">Manage your personal AI integration and preferences.</p>
        </motion.div>

        {/* OpenAI API Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-blue-500/20 border border-white/10 flex items-center justify-center shadow-lg">
              <Key className="text-accent" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">OpenAI API Key</h2>
              <p className="text-sm text-gray-400">Use your own key for unlimited personal generations</p>
            </div>
          </div>

          {/* Current status badge */}
          {!loading && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold mb-6 w-fit ${hasKey ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {hasKey ? (
                <>
                  <ShieldCheck size={16} />
                  Active Key: <span className="font-mono text-green-300">{savedKey}</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-yellow-400" />
                  <span className="text-yellow-300">No personal key configured</span>
                  <span className="text-gray-500 font-normal">&mdash; using free fallback generator</span>
                </>
              )}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Loader2 size={14} className="animate-spin" /> Fetching key status...
            </div>
          )}

          {/* Input Area */}
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-accent transition-colors">
                <Key size={18} />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={hasKey ? 'Paste new key to replace existing...' : 'sk-proj-...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 active:scale-[0.98] transition-all font-bold text-white text-sm shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : (hasKey ? 'Update Key' : 'Save Key')}
              </button>

              {hasKey && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="py-3 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {removing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {removing ? '...' : 'Remove'}
                </button>
              )}
            </div>
          </div>

          {/* How to get a key */}
          <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">How to get your key</p>
            <ol className="text-xs text-gray-500 space-y-1 list-none">
              <li className="flex items-center gap-2"><span className="text-accent font-bold">1.</span> Visit platform.openai.com and sign in</li>
              <li className="flex items-center gap-2"><span className="text-accent font-bold">2.</span> Go to API Keys section in the dashboard</li>
              <li className="flex items-center gap-2"><span className="text-accent font-bold">3.</span> Click "Create new secret key" and copy it here</li>
            </ol>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 font-bold transition-colors mt-1"
            >
              <ExternalLink size={12} />
              Open OpenAI Platform
            </a>
          </div>
        </motion.div>

        {/* Privacy notice card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 flex items-start gap-4"
        >
          <ShieldCheck className="text-green-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-white mb-1">Your key is private &amp; secure</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your API key is stored securely in our encrypted database and is only used server-side to make requests to OpenAI on your behalf. We never share, log, or expose your raw key to the browser or any third party.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm ${
              toast.type === 'success'
                ? 'bg-gray-900 border-green-500/30 text-green-300'
                : 'bg-gray-900 border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
