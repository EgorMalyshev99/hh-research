import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const deleteBlacklistEntry = async (id: number) => {
  await api.delete(`/blacklist/${id}`)
}

export const useDeleteBlacklistEntryMutation = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: deleteBlacklistEntry,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.blacklist.list() })
    },
  })
}
