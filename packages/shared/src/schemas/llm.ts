import { z } from 'zod'

/** Идентификатор LLM-провайдера: UI + `POST /search/run`, поля `settings`, ключи API только в `.env` на сервере. */
export const LlmProviderIdSchema = z.enum(['gemini', 'openrouter', 'groq'])
export type LlmProviderId = z.infer<typeof LlmProviderIdSchema>

/** Провайдер + модель для одного запуска скоринга (тело POST /search/run или настройки пользователя). */
export const LlmRuntimeContextSchema = z.object({
  provider: LlmProviderIdSchema,
  model: z.string().min(1),
})

export type LlmRuntimeContext = z.infer<typeof LlmRuntimeContextSchema>

export const LlmStatusSchema = z.object({
  ok: z.boolean(),
  provider: z.string(),
  message: z.string().optional(),
})

export type LlmStatus = z.infer<typeof LlmStatusSchema>

export const LlmUnavailableErrorSchema = z.object({
  code: z.literal('LLM_UNAVAILABLE'),
  message: z.string(),
})

export type LlmUnavailableError = z.infer<typeof LlmUnavailableErrorSchema>

/** Ответ `GET /api/llm/status` — доступность каждого провайдера по ключам из env */
export const LlmProvidersStatusSchema = z.object({
  gemini: LlmStatusSchema,
  openrouter: LlmStatusSchema,
  groq: LlmStatusSchema,
})

export type LlmProvidersStatus = z.infer<typeof LlmProvidersStatusSchema>
