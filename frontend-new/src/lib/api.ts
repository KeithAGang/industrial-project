import axios from 'axios'
import { getToken, logout } from './auth'

const api = axios.create({
  baseURL: '/api',
})

// Seed from localStorage on module init (covers page reloads)
const _t = getToken()
if (_t) api.defaults.headers.common['Authorization'] = `Bearer ${_t}`

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      logout()
    }
    return Promise.reject(error)
  }
)

export default api
