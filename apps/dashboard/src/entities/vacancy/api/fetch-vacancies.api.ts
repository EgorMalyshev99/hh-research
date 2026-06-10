import { StoredVacancyListSchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export interface VacancyCatalogFilters {
  q?: string
  location?: string
  source?: string
}

export const fetchVacancies = async (filters: VacancyCatalogFilters = {}) => {
  const { data } = await api.get<unknown>('/vacancies', { params: filters })
  return StoredVacancyListSchema.parse(data)
}

export const useVacanciesQuery = (filters: MaybeRef<VacancyCatalogFilters> = {}) =>
  useQuery({
    queryKey: computed(() => queryKeys.vacancies.list({ ...unref(filters) })),
    queryFn: () => fetchVacancies(unref(filters)),
  })
