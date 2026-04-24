import { SearchRunListSchema } from '@repo/shared'

import { http } from '@/shared/api/http'

export async function fetchSearchHistory() {
  const { data } = await http.get<unknown>('/history')
  return SearchRunListSchema.parse(data)
}
