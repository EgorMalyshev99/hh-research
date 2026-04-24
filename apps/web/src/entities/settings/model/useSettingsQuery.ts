import { useQuery } from '@tanstack/vue-query'

import { fetchSettings } from '../api/settings.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.me(),
    queryFn: fetchSettings,
  })
}
