import { StoredVacancyListSchema, StoredVacancyRowSchema, VacancyCreateSchema, VacancyUpdateSchema } from '@repo/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchMyVacancies = async () => {
  const { data } = await api.get<unknown>('/my-vacancies')
  return StoredVacancyListSchema.parse(data)
}

export const useMyVacanciesQuery = () =>
  useQuery({
    queryKey: queryKeys.myVacancies.list(),
    queryFn: fetchMyVacancies,
  })

export const createMyVacancy = async (body: z.infer<typeof VacancyCreateSchema>) => {
  const dto = VacancyCreateSchema.parse(body)
  const { data } = await api.post<unknown>('/my-vacancies', dto)
  return StoredVacancyRowSchema.parse(data)
}

export const updateMyVacancy = async (params: { id: number; body: z.infer<typeof VacancyUpdateSchema> }) => {
  const dto = VacancyUpdateSchema.parse(params.body)
  const { data } = await api.put<unknown>(`/my-vacancies/${params.id}`, dto)
  return StoredVacancyRowSchema.parse(data)
}

export const deleteMyVacancy = async (id: number) => {
  await api.delete(`/my-vacancies/${id}`)
}

export const useCreateMyVacancyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMyVacancy,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myVacancies.all() }),
  })
}

export const useUpdateMyVacancyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMyVacancy,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myVacancies.all() }),
  })
}

export const useDeleteMyVacancyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMyVacancy,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myVacancies.all() }),
  })
}
