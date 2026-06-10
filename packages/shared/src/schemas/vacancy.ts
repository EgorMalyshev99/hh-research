import { z } from 'zod'

/** Источник вакансии в каталоге */
export const VacancySourceSchema = z.enum(['manual', 'trudvsem', 'superjob'])

export const VacancyDataSchema = z.object({
  title: z.string(),
  employer: z.object({
    name: z.string(),
    logoUrl: z.string().url().optional(),
  }),
  location: z.object({
    name: z.string(),
    regionCode: z.string().optional(),
  }),
  description: z.string(),
  url: z.string().url(),
  salary: z
    .object({
      from: z.number().nullable(),
      to: z.number().nullable(),
      currency: z.string(),
      gross: z.boolean().nullable().optional(),
    })
    .nullable()
    .optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().datetime(),
})

export const VacancyCreateSchema = z.object({
  title: z.string().min(1).max(500),
  employerName: z.string().min(1).max(300),
  locationName: z.string().min(1).max(300),
  description: z.string().min(1).max(50_000),
  url: z.string().url(),
  salaryFrom: z.number().int().positive().optional(),
  salaryTo: z.number().int().positive().optional(),
  salaryCurrency: z.string().max(10).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
})

export const VacancyUpdateSchema = VacancyCreateSchema.partial()

export const VacancyListQuerySchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  source: VacancySourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

/** Per-user состояние вакансии (скоринг, флаги) */
export const VacancyUserStateSchema = z.object({
  isViewed: z.boolean(),
  isApplied: z.boolean(),
  hidden: z.boolean(),
  score: z.number().nullable(),
  scoreReason: z.string().nullable(),
  coverLetter: z.string().nullable(),
  processedAt: z.string().datetime().nullable(),
})

/** Ответ `GET /api/vacancies` и `GET /api/vacancies/:id` */
export const StoredVacancyRowSchema = z.object({
  id: z.number(),
  source: VacancySourceSchema,
  externalId: z.string().nullable(),
  ownerUserId: z.number().nullable(),
  data: VacancyDataSchema,
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  userState: VacancyUserStateSchema.optional(),
})

export const StoredVacancyListSchema = z.array(StoredVacancyRowSchema)

/** Ответ LLM при анализе резюме */
export const LlmResumeAnalysisResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
  highlights: z.array(z.string()).optional(),
})

export const AnalyzeResumeBodySchema = z.object({
  resumeText: z.string().min(50).max(50_000),
  llmProvider: z.enum(['gemini', 'openrouter', 'groq']).optional(),
  llmModel: z.string().min(1).optional(),
})

export type VacancySource = z.infer<typeof VacancySourceSchema>
export type VacancyData = z.infer<typeof VacancyDataSchema>
export type VacancyCreateDto = z.infer<typeof VacancyCreateSchema>
export type VacancyUpdateDto = z.infer<typeof VacancyUpdateSchema>
export type VacancyListQuery = z.infer<typeof VacancyListQuerySchema>
export type VacancyUserState = z.infer<typeof VacancyUserStateSchema>
export type StoredVacancyRow = z.infer<typeof StoredVacancyRowSchema>
export type LlmResumeAnalysisResponse = z.infer<typeof LlmResumeAnalysisResponseSchema>
export type AnalyzeResumeBody = z.infer<typeof AnalyzeResumeBodySchema>
