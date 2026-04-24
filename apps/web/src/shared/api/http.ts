import axios, { type AxiosError } from 'axios'

import { API_BASE_URL } from '@/shared/config/env'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const cfg = error.config

    const isRefreshRequest = cfg.url?.includes('/auth/refresh') ?? false

    if (error.response?.status === 401 && !isRefreshRequest) {
      try {
        const { data } = await http.post<{ accessToken: string }>('/auth/refresh')
        localStorage.setItem('access_token', data.accessToken)
        if (cfg.headers) {
          cfg.headers.Authorization = `Bearer ${data.accessToken}`
        }
        return http.request(cfg)
      } catch {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    if (!error.response) {
      error.message = 'Нет соединения с сервером. Проверьте сеть и что API запущен.'
    } else {
      const data = error.response.data
      if (data && typeof data === 'object' && 'message' in data) {
        const raw = (data as { message: unknown }).message
        const msg = Array.isArray(raw) ? raw.join('; ') : String(raw ?? '')
        if (msg) {
          error.message = msg
        }
      }
      const ext = error as AxiosError & {
        apiMeta?: { code?: string; requestId?: string }
      }
      if (data && typeof data === 'object') {
        const d = data as { code?: unknown; requestId?: unknown }
        ext.apiMeta = {
          code: typeof d.code === 'string' ? d.code : undefined,
          requestId: typeof d.requestId === 'string' ? d.requestId : undefined,
        }
      }
    }

    return Promise.reject(error)
  }
)
