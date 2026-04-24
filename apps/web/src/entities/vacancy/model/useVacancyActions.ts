import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { hideVacancy, markVacancyApplied, markVacancyViewed } from '../api/vacancy.api'

import { showApiMutationErrorToast } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'

export function useVacancyActions() {
  const qc = useQueryClient()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() })
    void qc.invalidateQueries({ queryKey: queryKeys.stats.summary() })
  }

  const viewed = useMutation({
    mutationFn: (id: number) => markVacancyViewed(id),
    onSuccess: invalidate,
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось отметить просмотр')
    },
  })

  const applied = useMutation({
    mutationFn: (id: number) => markVacancyApplied(id),
    onSuccess: invalidate,
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось отметить отклик')
    },
  })

  const hide = useMutation({
    mutationFn: (id: number) => hideVacancy(id),
    onSuccess: invalidate,
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось скрыть вакансию')
    },
  })

  return { viewed, applied, hide }
}
