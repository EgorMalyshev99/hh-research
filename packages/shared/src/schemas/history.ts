import { z } from 'zod'

export const SearchRunSchema = z.object({
  id: z.number(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: z.string(),
  totalFound: z.number(),
  aboveThreshold: z.number(),
  errorMessage: z.string().nullable(),
})

export const SearchRunListSchema = z.array(SearchRunSchema)

export type SearchRun = z.infer<typeof SearchRunSchema>
