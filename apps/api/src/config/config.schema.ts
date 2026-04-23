import { z } from 'zod'

export const configSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL должен быть корректным URL'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET должен быть минимум 32 символа'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET должен быть минимум 32 символа'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url('FRONTEND_URL должен быть корректным URL'),
  /** База REST hh.ru (без завершающего /) */
  HH_API_BASE: z.string().url().default('https://api.hh.ru'),
  /** Google AI Studio / Generative Language API (без завершающего /), например …/v1beta */
  GEMINI_API_BASE: z.string().url().default('https://generativelanguage.googleapis.com/v1beta'),
  GEMINI_API_KEY: z.string().optional(),
  /** OpenRouter: OpenAI-совместимый префикс до /v1 включительно */
  OPENROUTER_API_BASE: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_API_KEY: z.string().optional(),
  /** Опционально для OpenRouter (`HTTP-Referer`) */
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  /** Groq: OpenAI-совместимый префикс до /v1 включительно */
  GROQ_API_BASE: z.string().url().default('https://api.groq.com/openai/v1'),
  GROQ_API_KEY: z.string().optional(),
})

export type AppConfig = z.infer<typeof configSchema>

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(config)
  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(`Ошибка конфигурации:\n${errors}`)
  }
  return result.data
}
