import { z } from 'zod'

export const VacancyStatsSchema = z.object({
  total: z.number(),
  viewed: z.number(),
  applied: z.number(),
})

export type VacancyStats = z.infer<typeof VacancyStatsSchema>
