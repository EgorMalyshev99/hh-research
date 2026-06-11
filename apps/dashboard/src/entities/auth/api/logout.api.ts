import type { LogoutBodyDto } from '@repo/shared'

import { api } from '@/shared/api/http'
import { getRefreshToken } from '@/shared/lib/auth-storage'

export const logout = () => {
  const refreshToken = getRefreshToken()
  const body: LogoutBodyDto = refreshToken ? { refreshToken } : {}
  return api.post('/auth/logout', body).then((r) => r.data)
}
