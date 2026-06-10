import { computed } from 'vue'

import { useRuntimeConfig } from '#app'

export function useSiteConfig() {
  const config = useRuntimeConfig()

  const dashboardLoginUrl = computed(() => {
    const base = String(config.public.dashboardUrl ?? '').replace(/\/$/, '')
    return base ? `${base}/login` : '/login'
  })

  return {
    dashboardLoginUrl,
  }
}
