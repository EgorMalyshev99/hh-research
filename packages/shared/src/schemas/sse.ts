import { z } from 'zod'
import { ScoredVacancySchema } from './vacancy.js'

export const SseEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('search:started'),
    data: z.object({ query: z.string(), total: z.number().optional() }),
  }),
  z.object({
    type: z.literal('search:progress'),
    data: z.object({ current: z.number(), total: z.number() }),
  }),
  z.object({
    type: z.literal('vacancy:scored'),
    data: ScoredVacancySchema,
  }),
  z.object({
    type: z.literal('search:completed'),
    data: z.object({ total: z.number(), relevant: z.number() }),
  }),
  z.object({
    type: z.literal('search:error'),
    data: z.object({ message: z.string() }),
  }),
  z.object({
    type: z.literal('letter:generating'),
    data: z.object({ vacancyId: z.string() }),
  }),
  z.object({
    type: z.literal('letter:chunk'),
    data: z.object({ vacancyId: z.string(), chunk: z.string() }),
  }),
  z.object({
    type: z.literal('letter:done'),
    data: z.object({ vacancyId: z.string(), letter: z.string() }),
  }),
])

export type SseEvent = z.infer<typeof SseEventSchema>
