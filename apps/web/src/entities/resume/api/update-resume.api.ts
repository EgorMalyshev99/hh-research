import { ResumeInputSchema, ResumeSchema, type ResumeInput } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const updateResume = async (params: { id: number; body: ResumeInput }) => {
  const parsed = ResumeInputSchema.parse(params.body)
  const { data } = await api.put<unknown>(`/resumes/${params.id}`, parsed)
  return ResumeSchema.parse(data)
}

export const useUpdateResumeMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateResume,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.resumes.list() })
    },
  })
}
