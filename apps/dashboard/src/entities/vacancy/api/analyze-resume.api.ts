import { StoredVacancyRowSchema } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const analyzeResume = async (params: { vacancyId: number; resumeText: string }) => {
  const { data } = await api.post<unknown>(`/vacancies/${params.vacancyId}/analyze-resume`, {
    resumeText: params.resumeText,
  })
  return StoredVacancyRowSchema.parse((data as { vacancy: unknown }).vacancy ?? data)
}

export const useAnalyzeResumeMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: analyzeResume,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.all() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats.summary() }),
      ])
    },
  })
}
