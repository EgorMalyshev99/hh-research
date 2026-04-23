import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { LlmProviderId, LlmProvidersStatus, LlmRuntimeContext, LlmStatus } from '@repo/shared'
import { LlmScoreResponseSchema, type LlmScoreResponse } from '@repo/shared'
import type { AppConfig } from '../config/config.schema.js'
import { buildCoverLetterPrompt, buildScorePrompt } from './prompts/templates.js'

const RESUME_MAX_CHARS = 32_000

const ALL_PROVIDERS: LlmProviderId[] = ['gemini', 'openrouter', 'groq']

/** Groq и OpenRouter — OpenAI-совместимый `/v1/models` и `/v1/chat/completions`. */
function isOpenAiCompatible(provider: LlmProviderId): provider is 'groq' | 'openrouter' {
  return provider === 'groq' || provider === 'openrouter'
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)

  constructor(private configService: ConfigService<AppConfig, true>) {}

  /** Доступность всех провайдеров (для UI при выборе модели). */
  async getProvidersStatus(timeoutMs = 4000): Promise<LlmProvidersStatus> {
    const entries = await Promise.all(
      ALL_PROVIDERS.map(async (p) => [p, await this.checkProvider(p, timeoutMs)] as const),
    )
    return Object.fromEntries(entries) as LlmProvidersStatus
  }

  /** Проверка одного провайдера (лёгкий health-check). */
  async checkProvider(provider: LlmProviderId, timeoutMs = 4000): Promise<LlmStatus> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      if (provider === 'gemini') {
        return await this.checkGemini(provider, controller.signal)
      }
      if (isOpenAiCompatible(provider)) {
        const cfg = this.getOpenAiCompatibleConfig(provider)
        if (!cfg.apiKey) {
          return { ok: false, provider, message: `${cfg.keyEnvName} не задан в окружении` }
        }
        const res = await fetch(`${cfg.base}/models`, {
          headers: { ...cfg.extraHeaders, Authorization: `Bearer ${cfg.apiKey}` },
          signal: controller.signal,
        })
        if (!res.ok) {
          return { ok: false, provider, message: `${provider} HTTP ${res.status}` }
        }
        return { ok: true, provider }
      }
      return { ok: false, provider: String(provider), message: 'Неизвестный провайдер' }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { ok: false, provider, message }
    } finally {
      clearTimeout(timer)
    }
  }

  private async checkGemini(provider: LlmProviderId, signal: AbortSignal): Promise<LlmStatus> {
    const key = this.configService.get('GEMINI_API_KEY')
    if (!key) {
      return { ok: false, provider, message: 'GEMINI_API_KEY не задан в окружении' }
    }
    const base = this.trimBase(this.configService.getOrThrow('GEMINI_API_BASE'))
    const url = `${base}/models?key=${encodeURIComponent(key)}`
    const res = await fetch(url, { signal })
    if (!res.ok) {
      return { ok: false, provider, message: `Gemini HTTP ${res.status}` }
    }
    return { ok: true, provider }
  }

  async assertLlmAvailable(ctx: { provider: LlmProviderId }): Promise<void> {
    const st = await this.checkProvider(ctx.provider)
    if (!st.ok) {
      throw new HttpException(
        { code: 'LLM_UNAVAILABLE' as const, message: st.message ?? 'LLM недоступен' },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
  }

  async scoreVacancy(
    vacancyText: string,
    resumeMarkdown: string,
    ctx: LlmRuntimeContext,
  ): Promise<LlmScoreResponse> {
    const resume = this.truncateResume(resumeMarkdown)
    const prompt = buildScorePrompt(resume, vacancyText)
    this.logger.debug(`Скоринг через ${ctx.provider}/${ctx.model}`)
    const rawResponse = await this.callLlm(prompt, ctx.provider, ctx.model)
    return LlmScoreResponseSchema.parse(JSON.parse(rawResponse))
  }

  async generateCoverLetter(
    vacancyText: string,
    resumeMarkdown: string,
    letterCfg: { tone: string; length: string; language: string },
    ctx: LlmRuntimeContext,
  ): Promise<string> {
    const resume = this.truncateResume(resumeMarkdown)
    const prompt = buildCoverLetterPrompt(resume, vacancyText, letterCfg)
    return this.callLlm(prompt, ctx.provider, ctx.model)
  }

  private trimBase(url: string): string {
    return url.replace(/\/$/, '')
  }

  private getOpenAiCompatibleConfig(provider: 'groq' | 'openrouter'): {
    base: string
    apiKey: string | undefined
    keyEnvName: string
    extraHeaders: Record<string, string>
  } {
    switch (provider) {
      case 'groq':
        return {
          base: this.trimBase(this.configService.getOrThrow('GROQ_API_BASE')),
          apiKey: this.configService.get('GROQ_API_KEY'),
          keyEnvName: 'GROQ_API_KEY',
          extraHeaders: {},
        }
      case 'openrouter': {
        const extra: Record<string, string> = { 'X-Title': 'hh-assistant' }
        const referer = this.configService.get('OPENROUTER_HTTP_REFERER')
        if (referer) {
          extra['HTTP-Referer'] = referer
        }
        return {
          base: this.trimBase(this.configService.getOrThrow('OPENROUTER_API_BASE')),
          apiKey: this.configService.get('OPENROUTER_API_KEY'),
          keyEnvName: 'OPENROUTER_API_KEY',
          extraHeaders: extra,
        }
      }
    }
  }

  private truncateResume(markdown: string): string {
    if (markdown.length <= RESUME_MAX_CHARS) return markdown
    this.logger.warn(
      `Резюме обрезано с ${markdown.length} до ${RESUME_MAX_CHARS} символов (~лимит токенов)`,
    )
    return markdown.slice(0, RESUME_MAX_CHARS)
  }

  private async callLlm(prompt: string, provider: LlmProviderId, model: string): Promise<string> {
    if (provider === 'gemini') {
      return this.callGemini(prompt, model)
    }
    if (isOpenAiCompatible(provider)) {
      return this.callOpenAiCompatibleChat(provider, prompt, model)
    }
    throw new Error(`Неизвестный LLM провайдер: ${provider}`)
  }

  private async callGemini(prompt: string, model: string): Promise<string> {
    const apiKey = this.configService.getOrThrow('GEMINI_API_KEY')
    const base = this.trimBase(this.configService.getOrThrow('GEMINI_API_BASE'))
    const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = (await response.json()) as GeminiGenerateResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    if (!text.trim()) {
      throw new Error('Gemini вернул пустой ответ')
    }
    return text
  }

  /** OpenAI-совместимые `GET /models` и `POST /chat/completions` (Groq, OpenRouter). */
  private async callOpenAiCompatibleChat(
    provider: 'groq' | 'openrouter',
    prompt: string,
    model: string,
  ): Promise<string> {
    const cfg = this.getOpenAiCompatibleConfig(provider)
    if (!cfg.apiKey) {
      throw new Error(`${cfg.keyEnvName} не задан`)
    }
    const response = await fetch(`${cfg.base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...cfg.extraHeaders,
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`${provider} API error: ${response.status}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    const content = data.choices[0]?.message.content
    if (!content) throw new Error(`${provider} вернул пустой ответ`)
    return content
  }
}
