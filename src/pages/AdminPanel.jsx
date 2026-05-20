import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, Search, Star, Eye, Trash2, ChevronDown, ChevronRight, Lock, AlertCircle, BarChart3, Mail, Key, LogOut, Activity } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://prompt-generator-8e6c.onrender.com'

export default function AdminPanel() {
  const [adminSecret, setAdminSecret] = useState(() => sessionStorage.getItem('admin_secret') || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [allQueries, setAllQueries] = useState([])
  const [expandedUser, setExpandedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'users' | 'queries'
  const [detailLoading, setDetailLoading] = useState(false)

  const headers = { 'X-Admin-Secret': adminSecret }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_URL}/admin/login`, { secret: adminSecret })
      sessionStorage.setItem('admin_secret', adminSecret)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_secret')
    setAdminSecret('')
    setIsAuthenticated(false)
    setStats(null)
    setUsers([])
    setAllQueries([])
  }

  // Fetch all admin data on auth
  useEffect(() => {
    if (!isAuthenticated) return
    fetchStats()
    fetchUsers()
    fetchQueries()
  }, [isAuthenticated])

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, { headers })
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`, { headers })
      setUsers(res.data)
    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/queries`, { headers })
      setAllQueries(res.data)
    } catch (err) {
      console.error('Failed to fetch queries', err)
    }
  }

  const handleExpandUser = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      setUserDetail(null)
      return
    }
    setExpandedUser(userId)
    setDetailLoading(true)
    try {
      const res = await axios.get(`${API_URL}/admin/users/${userId}`, { headers })
      setUserDetail(res.data)
    } catch (err) {
      console.error('Failed to fetch user detail', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION\n\nDelete user "${email}" and ALL their data?\n\nThis cannot be undone.`)) return
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, { headers })
      setUsers(prev => prev.filter(u => u.id !== userId))
      setExpandedUser(null)
      setUserDetail(null)
      fetchStats()
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.error || err.message))
    }
  }

  // Auto-authenticate if session secret exists
  useEffect(() => {
    if (adminSecret && !isAuthenticated) {
      axios.post(`${API_URL}/admin/login`, { secret: adminSecret })
        .then(() => setIsAuthenticated(true))
        .catch(() => sessionStorage.removeItem('admin_secret'))
    }
  }, [])

  // ── Login Screen ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/15 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-900/10 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <Shield className="text-red-400" size={28} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-white">Admin Console</h1>
            <p className="text-gray-500 text-sm">Restricted access — authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] shadow-2xl flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-400 transition-colors">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="Admin Secret Key"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !adminSecret}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-[0.98] transition-all font-bold text-white text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    )
  }

  // ── Authenticated Admin Dashboard ────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-red-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-orange-900/8 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <Shield size={18} />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Admin Console</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/15">restricted</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-black/40 border border-white/5 mb-8 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'queries', label: 'Search Logs', icon: Search },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-red-500/20 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ─────────────────────────────── */}
        {activeTab === 'overview' && stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.total_users, icon: Users, color: 'blue' },
                { label: 'Email Users', value: stats.email_users, icon: Mail, color: 'green' },
                { label: 'Google Users', value: stats.google_users, icon: Shield, color: 'orange' },
                { label: 'Total Queries', value: stats.total_queries, icon: Search, color: 'purple' },
                { label: 'Favorites', value: stats.total_favorites, icon: Star, color: 'yellow' },
                { label: 'With API Key', value: stats.users_with_api_key, icon: Key, color: 'pink' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-${stat.color}-500/20 transition-all`}>
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400 w-fit mb-2`}>
                    <stat.icon size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick User List Preview */}
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={14} className="text-red-400" />
                Recent Users
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {users.slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        u.login_method === 'google' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {u.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{u.email}</p>
                        <p className="text-[10px] text-gray-500">{u.login_method === 'google' ? 'Google OAuth' : 'Email/Password'} · {u.query_count} queries</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      u.login_method === 'google'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {u.login_method}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Users Tab ─────────────────────────────────── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={14} className="text-blue-400" />
                  All Registered Users ({users.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {users.map(u => (
                  <div key={u.id} className="border border-white/5 rounded-xl overflow-hidden">
                    {/* User Row */}
                    <div
                      onClick={() => handleExpandUser(u.id)}
                      className="flex items-center justify-between p-3.5 bg-black/30 hover:bg-white/[0.03] cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          u.login_method === 'google' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {u.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              u.login_method === 'google'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {u.login_method}
                            </span>
                            <span className="text-[10px] text-gray-500">{u.query_count} searches · {u.favorite_count} favorites</span>
                            {u.has_api_key && (
                              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">API KEY</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20"
                          title="Delete user"
                        >
                          <Trash2 size={12} />
                        </button>
                        {expandedUser === u.id ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    <AnimatePresence>
                      {expandedUser === u.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-black/50 border-t border-white/5">
                            {detailLoading ? (
                              <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
                              </div>
                            ) : userDetail ? (
                              <div className="space-y-4">
                                {/* User Info Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                                    <p className="text-xs font-bold text-white">#{userDetail.id}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-xs font-bold text-white truncate">{userDetail.email}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Auth Method</p>
                                    <p className="text-xs font-bold text-white capitalize">{userDetail.login_method}</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">API Key</p>
                                    <p className="text-xs font-bold text-white">{userDetail.has_api_key ? '✅ Configured' : '❌ None'}</p>
                                  </div>
                                </div>

                                {/* Search History */}
                                <div>
                                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Search size={11} />
                                    Search History ({userDetail.queries?.length || 0})
                                  </h4>
                                  {userDetail.queries?.length > 0 ? (
                                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                      {userDetail.queries.map(q => (
                                        <div key={q.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs text-white font-medium truncate">{q.topic}</p>
                                            <p className="text-[10px] text-gray-500">
                                              {q.mood} · {q.platform} · {new Date(q.created_at).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-600 italic">No search history</p>
                                  )}
                                </div>

                                {/* Favorites */}
                                <div>
                                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Star size={11} />
                                    Saved Favorites ({userDetail.favorites?.length || 0})
                                  </h4>
                                  {userDetail.favorites?.length > 0 ? (
                                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                      {userDetail.favorites.map(f => (
                                        <div key={f.id} className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                          <p className="text-xs text-white font-medium truncate">{f.topic}</p>
                                          <p className="text-[10px] text-gray-500">
                                            {f.mood} · {f.platform} · {new Date(f.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-600 italic">No favorites saved</p>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Search Logs Tab ─────────────────────────── */}
        {activeTab === 'queries' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Search size={14} className="text-purple-400" />
                Global Search Logs (Latest 100)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-[9px] font-bold text-gray-500 uppercase tracking-wider py-2 px-3">User</th>
                      <th className="text-[9px] font-bold text-gray-500 uppercase tracking-wider py-2 px-3">Topic</th>
                      <th className="text-[9px] font-bold text-gray-500 uppercase tracking-wider py-2 px-3">Mood</th>
                      <th className="text-[9px] font-bold text-gray-500 uppercase tracking-wider py-2 px-3">Platform</th>
                      <th className="text-[9px] font-bold text-gray-500 uppercase tracking-wider py-2 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allQueries.map(q => (
                      <tr key={q.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-medium text-blue-300">{q.user_email}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-white font-medium">{q.topic}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-gray-400">{q.mood}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{q.platform}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-gray-500">{new Date(q.created_at).toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
