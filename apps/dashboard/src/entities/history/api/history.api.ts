import { SearchRunListSchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchSearchHistory = async () => {
  const { data } = await api.get<unknown>('/history')
  return SearchRunListSchema.parse(data)
}

export const useHistoryQuery = () =>
  useQuery({
    queryKey: queryKeys.history.list(),
    queryFn: fetchSearchHistory,
  })
