import axios from 'axios'
import { API_BASE_URL } from '@/shared/config/env'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Подставляет Bearer-токен если он есть в localStorage */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** При 401 пробует обновить токен через /auth/refresh */
http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config &&
      !error.config.url?.includes('/auth/refresh')
    ) {
      try {
        const { data } = await http.post<{ accessToken: string }>('/auth/refresh')
        localStorage.setItem('access_token', data.accessToken)
        if (error.config.headers) {
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
        }
        return http.request(error.config)
      } catch {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
