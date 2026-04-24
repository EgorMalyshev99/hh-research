import { StoredVacancyListSchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchVacancies = async () => {
  const { data } = await api.get<unknown>('/vacancies')
  return StoredVacancyListSchema.parse(data)
}

export const useVacanciesQuery = () =>
  useQuery({
    queryKey: queryKeys.vacancies.list(),
    queryFn: fetchVacancies,
  })
