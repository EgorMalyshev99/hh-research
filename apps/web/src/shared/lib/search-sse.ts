import { SearchStreamEventSchema, type SearchStreamEvent } from '@repo/shared'

import { apiPath } from '@/shared/config/env'

export type SearchStreamEventHandler = (event: SearchStreamEvent) => void

export function subscribeSearchStreamEvents(handler: SearchStreamEventHandler): () => void {
  const token = localStorage.getItem('access_token')
  const url = `${apiPath('/search/stream')}?access_token=${encodeURIComponent(token ?? '')}`
  const es = new EventSource(url, { withCredentials: true })

  es.onmessage = (event) => {
    const parsed = SearchStreamEventSchema.safeParse(JSON.parse(event.data))
    if (!parsed.success) return
    handler(parsed.data)
    if (parsed.data.type === 'done' || parsed.data.type === 'error') {
      es.close()
    }
  }

  es.onerror = () => {
    es.close()
  }

  return () => {
    es.close()
  }
}
