import type { UpdateSettingsDto } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { updateResumeMarkdown, updateSettings } from '../api/settings.api'

import { showApiMutationErrorToast } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'

export function useUpdateSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateSettingsDto) => updateSettings(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.settings.me() })
    },
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось сохранить настройки')
    },
  })
}

export function useUpdateResumeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (resumeMarkdown: string) => updateResumeMarkdown(resumeMarkdown),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.settings.me() })
    },
    onError: (error) => {
      showApiMutationErrorToast(error, 'Не удалось сохранить резюме')
    },
  })
}
