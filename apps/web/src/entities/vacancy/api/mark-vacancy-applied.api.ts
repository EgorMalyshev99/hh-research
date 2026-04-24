import { StoredVacancyRowSchema } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const markVacancyApplied = async (id: number) => {
  const { data } = await api.patch<unknown>(`/vacancies/${id}/applied`)
  return StoredVacancyRowSchema.parse(data)
}

export const useMarkVacancyAppliedMutation = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: markVacancyApplied,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats.summary() }),
      ])
    },
  })
}
