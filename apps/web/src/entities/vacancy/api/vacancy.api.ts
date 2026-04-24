import { StoredVacancyListSchema, StoredVacancyRowSchema } from '@repo/shared'

import { http } from '@/shared/api/http'

export async function fetchVacancies() {
  const { data } = await http.get<unknown>('/vacancies')
  return StoredVacancyListSchema.parse(data)
}

export async function markVacancyViewed(id: number) {
  const { data } = await http.patch<unknown>(`/vacancies/${id}/viewed`)
  return StoredVacancyRowSchema.parse(data)
}

export async function markVacancyApplied(id: number) {
  const { data } = await http.patch<unknown>(`/vacancies/${id}/applied`)
  return StoredVacancyRowSchema.parse(data)
}

export async function hideVacancy(id: number) {
  await http.delete(`/vacancies/${id}`)
}
