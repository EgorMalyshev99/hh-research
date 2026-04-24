import { StoredVacancyRowSchema } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const markVacancyViewed = async (id: number) => {
  const { data } = await api.patch<unknown>(`/vacancies/${id}/viewed`)
  return StoredVacancyRowSchema.parse(data)
}

export const useMarkVacancyViewedMutation = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: markVacancyViewed,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats.summary() }),
      ])
    },
  })
}
