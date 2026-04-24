import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const deleteResume = async (id: number) => {
  await api.delete(`/resumes/${id}`)
}

export const useDeleteResumeMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteResume,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.resumes.list() })
    },
  })
}
