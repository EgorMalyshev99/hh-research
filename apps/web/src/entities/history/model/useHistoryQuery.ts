import { useQuery } from '@tanstack/vue-query'

import { fetchSearchHistory } from '../api/history.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.history.list(),
    queryFn: fetchSearchHistory,
  })
}
