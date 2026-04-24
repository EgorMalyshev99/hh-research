import { z } from 'zod'

export const VacancySchema = z.object({
  id: z.string(),
  name: z.string(),
  employer: z.object({
    id: z.number().optional(),
    name: z.string(),
    logoUrls: z
      .object({
        original: z.string().optional(),
      })
      .optional(),
  }),
  salary: z
    .object({
      from: z.number().nullable(),
      to: z.number().nullable(),
      currency: z.string(),
      gross: z.boolean().nullable(),
    })
    .nullable(),
  area: z.object({
    id: z.string(),
    name: z.string(),
  }),
  publishedAt: z.string().datetime(),
  url: z.string().url(),
  alternateUrl: z.string().url(),
  snippet: z
    .object({
      requirement: z.string().nullable(),
      responsibility: z.string().nullable(),
    })
    .optional(),
  schedule: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  experience: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  employment: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export const ScoredVacancySchema = VacancySchema.extend({
  score: z.number().min(0).max(100),
  scoreReason: z.string(),
  isRelevant: z.boolean(),
  processedAt: z.string().datetime(),
})

/** Схема для валидации JSON-ответа LLM при скоринге */
export const LlmScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
})

/** Ответ LLM для батч-скоринга вакансий */
export const LlmBatchScoreItemSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  reason: z.string(),
})

export const LlmBatchScoreResponseSchema = z.array(LlmBatchScoreItemSchema)

/** Ответ `GET /api/vacancies` и `GET /api/vacancies/:id` */
export const StoredVacancyRowSchema = z.object({
  id: z.number(),
  hhId: z.string(),
  data: VacancySchema,
  score: z.number().nullable(),
  scoreReason: z.string().nullable(),
  isRelevant: z.boolean().nullable(),
  coverLetter: z.string().nullable(),
  processedAt: z.string().datetime().nullable(),
  isViewed: z.boolean(),
  isApplied: z.boolean(),
  createdAt: z.string().datetime(),
})

export const StoredVacancyListSchema = z.array(StoredVacancyRowSchema)

export type Vacancy = z.infer<typeof VacancySchema>
export type ScoredVacancy = z.infer<typeof ScoredVacancySchema>
export type LlmScoreResponse = z.infer<typeof LlmScoreResponseSchema>
export type LlmBatchScoreItem = z.infer<typeof LlmBatchScoreItemSchema>
export type StoredVacancyRow = z.infer<typeof StoredVacancyRowSchema>
