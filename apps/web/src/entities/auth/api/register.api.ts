import type { RegisterDto, Tokens } from '@repo/shared'

import { api } from '@/shared/api/http'

export const register = (dto: RegisterDto) => api.post<Tokens>('/auth/register', dto).then((r) => r.data)
