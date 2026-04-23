import type { LoginDto, RegisterDto, Tokens } from '@repo/shared'
import { http } from '@/shared/api/http'

export const authApi = {
  register: (dto: RegisterDto) => http.post<Tokens>('/auth/register', dto).then((r) => r.data),

  login: (dto: LoginDto) => http.post<Tokens>('/auth/login', dto).then((r) => r.data),

  logout: () => http.post('/auth/logout').then((r) => r.data),

  refresh: () => http.post<Tokens>('/auth/refresh').then((r) => r.data),
}
