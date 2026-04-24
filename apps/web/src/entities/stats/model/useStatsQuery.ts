import { useQuery } from '@tanstack/vue-query'

import { fetchVacancyStats } from '../api/stats.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats.summary(),
    queryFn: fetchVacancyStats,
  })
}
