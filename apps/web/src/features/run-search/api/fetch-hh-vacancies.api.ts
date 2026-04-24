import { VacancySchema, type RunSearchBody, type Vacancy } from '@repo/shared'
import { z } from 'zod'

import { api } from '@/shared/api/http'

const VacancyListSchema = z.array(VacancySchema)

export const fetchHhVacancies = async (body: RunSearchBody): Promise<Vacancy[]> => {
  const { data } = await api.post<unknown>('/hh/vacancies/search', body)
  return VacancyListSchema.parse(data)
}
