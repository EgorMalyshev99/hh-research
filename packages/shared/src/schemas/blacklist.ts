import { z } from 'zod'

export const CreateBlacklistEntrySchema = z.object({
  companyName: z.string().min(1).max(255),
})

export const BlacklistEntrySchema = z.object({
  id: z.number(),
  companyName: z.string(),
  createdAt: z.string().datetime(),
})

export type CreateBlacklistEntryDto = z.infer<typeof CreateBlacklistEntrySchema>
export type BlacklistEntryDto = z.infer<typeof BlacklistEntrySchema>
