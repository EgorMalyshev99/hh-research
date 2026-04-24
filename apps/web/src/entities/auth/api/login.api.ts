import type { LoginDto, Tokens } from '@repo/shared'

import { api } from '@/shared/api/http'

export const login = (dto: LoginDto) => api.post<Tokens>('/auth/login', dto).then((r) => r.data)
