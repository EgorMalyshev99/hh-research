import { BlacklistEntrySchema, CreateBlacklistEntrySchema, type CreateBlacklistEntryDto } from '@repo/shared'
import { z } from 'zod'

import { http } from '@/shared/api/http'

const ListSchema = z.array(BlacklistEntrySchema)

export async function fetchBlacklist() {
  const { data } = await http.get<unknown>('/blacklist')
  return ListSchema.parse(data)
}

export async function createBlacklistEntry(body: CreateBlacklistEntryDto) {
  const parsed = CreateBlacklistEntrySchema.parse(body)
  const { data } = await http.post<unknown>('/blacklist', parsed)
  return BlacklistEntrySchema.parse(data)
}

export async function deleteBlacklistEntry(id: number) {
  await http.delete(`/blacklist/${id}`)
}
