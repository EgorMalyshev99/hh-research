import type { Tokens } from '@repo/shared'

import { api } from '@/shared/api/http'

export const refresh = () => api.post<Tokens>('/auth/refresh').then((r) => r.data)
