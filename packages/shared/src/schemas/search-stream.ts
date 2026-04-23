import { z } from 'zod'

/** События SSE для GET /api/search/stream (совместимо с планом) */
export const SearchStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('progress'),
    stage: z.enum(['fetch', 'score', 'letter']),
    found: z.number().optional(),
    current: z
      .object({
        id: z.string(),
        name: z.string().optional(),
        score: z.number().optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal('done'),
    aboveThreshold: z.number(),
    total: z.number(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
])

export type SearchStreamEvent = z.infer<typeof SearchStreamEventSchema>
