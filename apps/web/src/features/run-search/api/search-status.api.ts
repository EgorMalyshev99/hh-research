import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

const SearchStatusSchema = z.object({
  running: z.boolean(),
})

export const fetchSearchStatus = async () => {
  const { data } = await api.get<unknown>('/search/status')
  return SearchStatusSchema.parse(data)
}

export const useSearchStatusQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.search.status(),
    queryFn: fetchSearchStatus,
    enabled,
    refetchInterval: (query) => (query.state.data?.running ? 5000 : false),
  })
