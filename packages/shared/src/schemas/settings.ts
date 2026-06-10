import { z } from 'zod'
import { LlmProviderIdSchema } from './llm'

/** Фильтры каталога вакансий (UI job_seeker) */
export const CatalogFilterSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  source: z.enum(['manual', 'trudvsem', 'superjob']).optional(),
})

export const CoverLetterConfigSchema = z.object({
  tone: z.enum(['formal', 'friendly', 'enthusiastic']).default('friendly'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  language: z.enum(['ru', 'en']).default('ru'),
  highlightSkills: z.array(z.string()).default([]),
})

export type CatalogFilter = z.infer<typeof CatalogFilterSchema>
export type CoverLetterConfig = z.infer<typeof CoverLetterConfigSchema>

/** @deprecated удалено в этапе 2 — оставлено для совместимости типов в LLM */
export const LlmProviderIdSchemaReexport = LlmProviderIdSchema
