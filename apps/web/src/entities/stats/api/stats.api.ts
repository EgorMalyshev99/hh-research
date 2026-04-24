import { VacancyStatsSchema } from '@repo/shared'

import { http } from '@/shared/api/http'

export async function fetchVacancyStats() {
  const { data } = await http.get<unknown>('/stats')
  return VacancyStatsSchema.parse(data)
}
