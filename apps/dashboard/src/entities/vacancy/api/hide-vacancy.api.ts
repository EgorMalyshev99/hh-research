import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const hideVacancy = async (id: number) => {
  await api.delete(`/vacancies/${id}`)
}

export const useHideVacancyMutation = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: hideVacancy,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats.summary() }),
      ])
    },
  })
}
