import type { SearchStreamEvent } from '@repo/shared'
import { onUnmounted, ref } from 'vue'

import { subscribeSearchStreamEvents } from '@/shared/lib/search-sse'

export function useSearchRunStream() {
  const events = ref<SearchStreamEvent[]>([])
  let unsubscribe: (() => void) | undefined

  function start() {
    stop()
    events.value = []
    unsubscribe = subscribeSearchStreamEvents((ev) => {
      events.value = [...events.value, ev]
    })
  }

  function stop() {
    unsubscribe?.()
    unsubscribe = undefined
  }

  onUnmounted(stop)

  return { events, start, stop }
}
