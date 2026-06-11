import type { RefreshBodyDto, Tokens } from '@repo/shared'

import { api } from '@/shared/api/http'

export const refresh = (dto: RefreshBodyDto) => api.post<Tokens>('/auth/refresh', dto).then((r) => r.data)
