
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://prompt-generator-8e6c.onrender.com'

const api = axios.create({
  baseURL: API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meta_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API access (401). Clearing invalid/expired session token and redirecting to login...")
      localStorage.removeItem('meta_token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default api
