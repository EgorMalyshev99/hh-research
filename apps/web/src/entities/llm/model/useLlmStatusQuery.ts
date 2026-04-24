import { useQuery } from '@tanstack/vue-query'

import { fetchLlmStatus } from '../api/llm.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useLlmStatusQuery() {
  return useQuery({
    queryKey: queryKeys.llm.status(),
    queryFn: fetchLlmStatus,
  })
}
