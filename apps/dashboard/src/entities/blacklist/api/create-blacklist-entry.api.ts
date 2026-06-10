import { BlacklistEntrySchema, CreateBlacklistEntrySchema, type CreateBlacklistEntryDto } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const createBlacklistEntry = async (body: CreateBlacklistEntryDto) => {
  const parsed = CreateBlacklistEntrySchema.parse(body)
  const { data } = await api.post<unknown>('/blacklist', parsed)
  return BlacklistEntrySchema.parse(data)
}

export const useCreateBlacklistEntryMutation = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: createBlacklistEntry,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.blacklist.list() })
    },
  })
}
