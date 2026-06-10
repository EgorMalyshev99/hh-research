import { StoredVacancyRowSchema } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

const GenerateCoverLetterBodySchema = z.object({
  resumeText: z.string().min(50),
})

export const generateCoverLetter = async (params: { vacancyId: number; resumeText: string }) => {
  const body = GenerateCoverLetterBodySchema.parse({ resumeText: params.resumeText })
  const { data } = await api.post<unknown>(`/vacancies/${params.vacancyId}/cover-letter`, body)
  return StoredVacancyRowSchema.parse(data)
}

export const useGenerateCoverLetterMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateCoverLetter,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.vacancies.all() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats.summary() }),
      ])
    },
  })
}
