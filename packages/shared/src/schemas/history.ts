import { z } from 'zod'

export const VacancyImportRunHistorySchema = z.object({
  id: z.number(),
  provider: z.string(),
  limitRequested: z.number(),
  imported: z.number(),
  skipped: z.number(),
  status: z.string(),
  errorMessage: z.string().nullable(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
})

export const VacancyImportRunHistoryListSchema = z.array(VacancyImportRunHistorySchema)

export type VacancyImportRunHistory = z.infer<typeof VacancyImportRunHistorySchema>

/** @deprecated этап 2 — используйте VacancyImportRunHistorySchema */
export const SearchRunSchema = VacancyImportRunHistorySchema
export const SearchRunListSchema = VacancyImportRunHistoryListSchema
export type SearchRun = VacancyImportRunHistory
