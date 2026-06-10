import { LlmProvidersStatusSchema, type LlmProvidersStatus } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchLlmStatus = async (): Promise<LlmProvidersStatus> => {
  const { data } = await api.get<unknown>('/llm/status')
  return LlmProvidersStatusSchema.parse(data)
}

export const useLlmStatusQuery = () =>
  useQuery({
    queryKey: queryKeys.llm.status(),
    queryFn: fetchLlmStatus,
  })
