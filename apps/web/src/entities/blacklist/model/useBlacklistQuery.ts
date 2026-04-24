import type { CreateBlacklistEntryDto } from '@repo/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { createBlacklistEntry, deleteBlacklistEntry, fetchBlacklist } from '../api/blacklist.api'

import { showApiMutationErrorToast } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'

export function useBlacklistQuery() {
  return useQuery({
    queryKey: queryKeys.blacklist.list(),
    queryFn: fetchBlacklist,
  })
}

export function useBlacklistMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.blacklist.list() })

  const create = useMutation({
    mutationFn: (body: CreateBlacklistEntryDto) => createBlacklistEntry(body),
    onSuccess: () => {
      void invalidate()
    },
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось добавить в blacklist')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteBlacklistEntry(id),
    onSuccess: () => {
      void invalidate()
    },
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось удалить из blacklist')
    },
  })

  return { create, remove }
}
