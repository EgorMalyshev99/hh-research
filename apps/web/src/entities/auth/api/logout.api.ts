import { api } from '@/shared/api/http'

export const logout = () => api.post('/auth/logout').then((r) => r.data)
