import { useQuery } from '@tanstack/vue-query'

import { fetchAreas } from '../api/hh.api'

import { queryKeys } from '@/shared/lib/query-keys'

export function useAreasQuery() {
  return useQuery({
    queryKey: queryKeys.hh.areas(),
    queryFn: fetchAreas,
    staleTime: 1000 * 60 * 60,
  })
}
