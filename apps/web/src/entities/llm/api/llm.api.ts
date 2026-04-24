import { LlmProvidersStatusSchema, type LlmProvidersStatus } from '@repo/shared'

import { http } from '@/shared/api/http'

export async function fetchLlmStatus(): Promise<LlmProvidersStatus> {
  const { data } = await http.get<unknown>('/llm/status')
  return LlmProvidersStatusSchema.parse(data)
}
