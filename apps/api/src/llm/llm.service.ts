import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  LlmBatchScoreResponseSchema,
  LlmScoreResponseSchema,
  type LlmBatchScoreItem,
  type LlmProviderId,
  type LlmProvidersStatus,
  type LlmRuntimeContext,
  type LlmScoreResponse,
  type LlmStatus,
} from '@repo/shared'

import type { AppConfig } from '../config/config.schema.js'

import { buildBatchScorePrompt, buildCoverLetterPrompt, buildScorePrompt } from './prompts/templates.js'

const ALL_PROVIDERS: LlmProviderId[] = ['gemini', 'openrouter', 'groq']

function isOpenAiCompatible(provider: LlmProviderId): provider is 'groq' | 'openrouter' {
  return provider === 'groq' || provider === 'openrouter'
}

interface GeminiGenerateResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
  }[]
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)

  constructor(private configService: ConfigService<AppConfig, true>) {}

  /** Доступность всех провайдеров (для UI при выборе модели). */
  async getProvidersStatus(timeoutMs = 4000): Promise<LlmProvidersStatus> {
    const entries = await Promise.all(
      ALL_PROVIDERS.map(async (p) => [p, await this.checkProvider(p, timeoutMs)] as const)
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
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  async scoreVacancy(vacancyText: string, ctx: LlmRuntimeContext): Promise<LlmScoreResponse> {
    const prompt = buildScorePrompt(vacancyText)
    this.logger.debug(`Скоринг через ${ctx.provider}/${ctx.model}`)
    const rawResponse = await this.callLlm(prompt, ctx.provider, ctx.model)
    return LlmScoreResponseSchema.parse(JSON.parse(rawResponse))
  }

  async scoreVacanciesBatch(
    vacancies: { id: string; text: string }[],
    resumeText: string,
    ctx: LlmRuntimeContext
  ): Promise<LlmBatchScoreItem[]> {
    if (!vacancies.length) return []
    const prompt = buildBatchScorePrompt(resumeText, vacancies)
    const rawResponse = await this.callLlm(prompt, ctx.provider, ctx.model)
    return LlmBatchScoreResponseSchema.parse(JSON.parse(rawResponse))
  }

  async generateCoverLetter(
    vacancyText: string,
    resumeText: string,
    letterCfg: { tone: string; length: string; language: string },
    ctx: LlmRuntimeContext
  ): Promise<string> {
    const prompt = buildCoverLetterPrompt(vacancyText, resumeText, letterCfg)
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

  private llmAbortSignal(): AbortSignal {
    const ms = this.configService.getOrThrow('LLM_REQUEST_TIMEOUT_MS', { infer: true })
    return AbortSignal.timeout(ms)
  }

  private throwIfLlmUpstreamError(response: Response, providerLabel: string): void {
    if (response.ok) return
    if (response.status === 429) {
      throw new HttpException(
        { code: 'LLM_RATE_LIMIT' as const, message: `${providerLabel}: HTTP 429` },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }
    throw new HttpException(
      { code: 'LLM_UPSTREAM' as const, message: `${providerLabel}: HTTP ${response.status}` },
      HttpStatus.BAD_GATEWAY
    )
  }

  private rethrowLlmFetchFailure(e: unknown, providerLabel: string): never {
    if (e instanceof HttpException) {
      throw e
    }
    if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
      throw new HttpException(
        { code: 'LLM_TIMEOUT' as const, message: 'Превышено время ожидания ответа LLM' },
        HttpStatus.GATEWAY_TIMEOUT
      )
    }
    const message = e instanceof Error ? e.message : String(e)
    throw new HttpException(
      { code: 'LLM_NETWORK' as const, message: `${providerLabel}: ${message}` },
      HttpStatus.BAD_GATEWAY
    )
  }

  private async callLlm(prompt: string, provider: LlmProviderId, model: string): Promise<string> {
    if (provider === 'gemini') {
      return this.callGemini(prompt, model)
    }
    if (isOpenAiCompatible(provider)) {
      return this.callOpenAiCompatibleChat(provider, prompt, model)
    }
    throw new HttpException(
      { code: 'LLM_BAD_PROVIDER' as const, message: `Неизвестный LLM провайдер: ${provider}` },
      HttpStatus.BAD_REQUEST
    )
  }

  private async callGemini(prompt: string, model: string): Promise<string> {
    const apiKey = this.configService.getOrThrow('GEMINI_API_KEY')
    const base = this.trimBase(this.configService.getOrThrow('GEMINI_API_BASE'))
    const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.llmAbortSignal(),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      })
    } catch (e) {
      this.rethrowLlmFetchFailure(e, 'Gemini')
    }

    this.throwIfLlmUpstreamError(response, 'Gemini')

    const data = (await response.json()) as GeminiGenerateResponse
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    if (!text.trim()) {
      throw new HttpException(
        { code: 'LLM_EMPTY' as const, message: 'Gemini вернул пустой ответ' },
        HttpStatus.BAD_GATEWAY
      )
    }
    return text
  }

  private async callOpenAiCompatibleChat(
    provider: 'groq' | 'openrouter',
    prompt: string,
    model: string
  ): Promise<string> {
    const cfg = this.getOpenAiCompatibleConfig(provider)
    if (!cfg.apiKey) {
      throw new HttpException(
        { code: 'LLM_CONFIG' as const, message: `${cfg.keyEnvName} не задан` },
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
    let response: Response
    try {
      response = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...cfg.extraHeaders,
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        signal: this.llmAbortSignal(),
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      })
    } catch (e) {
      this.rethrowLlmFetchFailure(e, provider)
    }

    this.throwIfLlmUpstreamError(response, provider)

    const data = (await response.json()) as { choices: { message: { content: string } }[] }
    const content = data.choices[0]?.message.content
    if (!content) {
      throw new HttpException(
        { code: 'LLM_EMPTY' as const, message: `${provider} вернул пустой ответ` },
        HttpStatus.BAD_GATEWAY
      )
    }
    return content
  }
}
