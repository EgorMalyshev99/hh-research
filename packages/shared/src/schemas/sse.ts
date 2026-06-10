import { z } from 'zod'

import { VacancyDataSchema } from './vacancy.js'

export const SseEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('import:started'),
    data: z.object({ provider: z.string(), limit: z.number() }),
  }),
  z.object({
    type: z.literal('import:progress'),
    data: z.object({ imported: z.number(), skipped: z.number() }),
  }),
  z.object({
    type: z.literal('import:completed'),
    data: z.object({ imported: z.number(), skipped: z.number() }),
  }),
  z.object({
    type: z.literal('import:error'),
    data: z.object({ message: z.string() }),
  }),
  z.object({
    type: z.literal('vacancy:imported'),
    data: VacancyDataSchema,
  }),
])

export type SseEvent = z.infer<typeof SseEventSchema>
