import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export interface HhArea {
  id: string
  name: string
  parentId: string | null
}

const HhAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
})
const HhAreaListSchema = z.array(HhAreaSchema)

export const fetchAreas = async (): Promise<HhArea[]> => {
  const { data } = await api.get<unknown>('/hh/areas')
  return HhAreaListSchema.parse(data)
}

export const useAreasQuery = () =>
  useQuery({
    queryKey: queryKeys.hh.areas(),
    queryFn: fetchAreas,
    staleTime: 1000 * 60 * 60,
  })
