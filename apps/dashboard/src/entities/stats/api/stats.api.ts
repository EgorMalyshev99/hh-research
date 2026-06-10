import { VacancyStatsSchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchVacancyStats = async () => {
  const { data } = await api.get<unknown>('/stats')
  return VacancyStatsSchema.parse(data)
}

export const useStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.stats.summary(),
    queryFn: fetchVacancyStats,
  })
