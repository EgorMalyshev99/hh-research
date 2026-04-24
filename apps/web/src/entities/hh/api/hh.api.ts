import { http } from '@/shared/api/http'

export interface HhArea {
  id: string
  name: string
  parentId: string | null
}

export async function fetchAreas(): Promise<HhArea[]> {
  const { data } = await http.get<HhArea[]>('/hh/areas')
  return data
}
