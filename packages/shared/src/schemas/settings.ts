import { z } from 'zod'
import { LlmProviderIdSchema } from './llm'

export const ScheduleFilterSchema = z.enum(['remote', 'office', 'hybrid', 'flexible'])

export const SearchConfigSchema = z.object({
  query: z.string().min(1),
  area: z.string().optional(),
  salary: z.number().optional(),
  experience: z.enum(['noExperience', 'between1And3', 'between3And6', 'moreThan6']).optional(),
  schedule: z.array(z.enum(['remote', 'fullDay', 'shift', 'flexible'])).optional(),
  /** UI-уровневый фильтр формата работы; имеет приоритет над schedule */
  scheduleFilter: z.array(ScheduleFilterSchema).optional(),
  onlyWithSalary: z.boolean().default(false),
  maxResults: z.number().min(1).max(200).default(100),
  /** Порог для isRelevant и для генерации письма (0–100) */
  relevanceThreshold: z.number().min(0).max(100).default(70),
})

export const CoverLetterConfigSchema = z.object({
  tone: z.enum(['formal', 'friendly', 'enthusiastic']).default('friendly'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  language: z.enum(['ru', 'en']).default('ru'),
  highlightSkills: z.array(z.string()).default([]),
})

export const SettingsSchema = z.object({
  id: z.number(),
  userId: z.number(),
  searchConfig: SearchConfigSchema.nullable(),
  coverLetterConfig: CoverLetterConfigSchema,
  resumeMarkdown: z.string().nullable(),
  llmProvider: LlmProviderIdSchema.default('gemini'),
  llmModel: z.string().default('gemini-2.0-flash'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const UpdateSettingsSchema = SettingsSchema.pick({
  searchConfig: true,
  coverLetterConfig: true,
  resumeMarkdown: true,
  llmProvider: true,
  llmModel: true,
}).partial()

/** Тело POST /search/run — переопределение полей поиска поверх сохранённых настроек + выбор LLM на этот запуск */
export const RunSearchBodySchema = SearchConfigSchema.partial().extend({
  llmProvider: LlmProviderIdSchema.optional(),
  llmModel: z.string().min(1).optional(),
})

export type ScheduleFilter = z.infer<typeof ScheduleFilterSchema>
export type SearchConfig = z.infer<typeof SearchConfigSchema>
export type CoverLetterConfig = z.infer<typeof CoverLetterConfigSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type UpdateSettingsDto = z.infer<typeof UpdateSettingsSchema>
export type RunSearchBody = z.infer<typeof RunSearchBodySchema>
