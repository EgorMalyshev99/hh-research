import { VacancyImportProviderListSchema, VacancyImportRunResultSchema } from '@repo/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchImportProviders = async () => {
  const { data } = await api.get<unknown>('/admin/vacancy-import/providers')
  return VacancyImportProviderListSchema.parse(data)
}

export const runVacancyImport = async (body: {
  provider: 'trudvsem' | 'superjob'
  limit: number
  text?: string
  regionCode?: string
  keyword?: string
  town?: number
}) => {
  const { data } = await api.post<unknown>('/admin/vacancy-import/run', body)
  return VacancyImportRunResultSchema.parse(data)
}

export const useImportProvidersQuery = () =>
  useQuery({
    queryKey: queryKeys.import.providers(),
    queryFn: fetchImportProviders,
  })

export const useRunVacancyImportMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runVacancyImport,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.history.list() }),
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.all() }),
      ])
    },
  })
}
