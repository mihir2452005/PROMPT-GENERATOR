
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://prompt-generator-8e6c.onrender.com'

const api = axios.create({
  baseURL: API_URL
})

export default api
