import { BlacklistEntrySchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

const ListSchema = z.array(BlacklistEntrySchema)

export const fetchBlacklist = async () => {
  const { data } = await api.get<unknown>('/blacklist')
  return ListSchema.parse(data)
}

export const useBlacklistQuery = () =>
  useQuery({
    queryKey: queryKeys.blacklist.list(),
    queryFn: fetchBlacklist,
  })
