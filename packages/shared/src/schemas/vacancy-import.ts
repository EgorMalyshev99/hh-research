import { z } from 'zod'

export const VacancyImportProviderIdSchema = z.enum(['trudvsem', 'superjob'])

export const VacancyImportRunBodySchema = z.object({
  provider: VacancyImportProviderIdSchema,
  limit: z.number().int().min(1).max(500),
  text: z.string().max(200).optional(),
  regionCode: z.string().max(10).optional(),
  keyword: z.string().max(200).optional(),
  town: z.coerce.number().int().positive().optional(),
})

export const VacancyImportRunResultSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(z.string()),
})

export const VacancyImportProviderSchema = z.object({
  id: VacancyImportProviderIdSchema,
  label: z.string(),
  enabled: z.boolean(),
  hint: z.string().optional(),
})

export const VacancyImportProviderListSchema = z.array(VacancyImportProviderSchema)

export type VacancyImportProviderId = z.infer<typeof VacancyImportProviderIdSchema>
export type VacancyImportRunBody = z.infer<typeof VacancyImportRunBodySchema>
export type VacancyImportRunResult = z.infer<typeof VacancyImportRunResultSchema>
