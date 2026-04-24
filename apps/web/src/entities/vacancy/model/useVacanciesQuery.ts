import { useQuery } from '@tanstack/vue-query'

import { fetchVacancies } from '../api/vacancy.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useVacanciesQuery() {
  return useQuery({
    queryKey: queryKeys.vacancies.list(),
    queryFn: fetchVacancies,
  })
}
