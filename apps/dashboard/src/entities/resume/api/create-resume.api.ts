import { ResumeInputSchema, ResumeSchema, type ResumeInput } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const createResume = async (body: ResumeInput) => {
  const parsed = ResumeInputSchema.parse(body)
  const { data } = await api.post<unknown>('/resumes', parsed)
  return ResumeSchema.parse(data)
}

export const useCreateResumeMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createResume,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.resumes.list() })
    },
  })
}
