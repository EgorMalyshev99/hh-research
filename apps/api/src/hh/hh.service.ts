import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { SearchConfig, Vacancy } from '@repo/shared'
import type { AppConfig } from '../config/config.schema.js'
import { mapHhVacancyToVacancy, passesHhItemFilters } from './hh.mapper.js'

const USER_AGENT = 'hh-assistant/1.0 (local; contact: dev@localhost)'

const MAX_PER_PAGE = 100
const REQUEST_DELAY_MS = 300
const FETCH_TIMEOUT_MS = 25_000
const MAX_RETRIES = 3

@Injectable()
export class HhService {
  private readonly logger = new Logger(HhService.name)

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  private get hhApiBase(): string {
    return this.configService.getOrThrow('HH_API_BASE').replace(/\/$/, '')
  }

  async searchVacancies(config: SearchConfig): Promise<Vacancy[]> {
    const maxResults = Math.min(config.maxResults ?? 100, 200)
    const perPage = Math.min(MAX_PER_PAGE, maxResults)
    const maxPage = Math.ceil(2000 / perPage) - 1

    const vacancies: Vacancy[] = []
    let page = 0

    while (vacancies.length < maxResults && page <= maxPage) {
      const params = new URLSearchParams({
        text: config.query,
        per_page: String(perPage),
        page: String(page),
        ...(config.area && { area: config.area }),
        ...(config.salary !== undefined && { salary: String(config.salary) }),
        ...(config.experience && { experience: config.experience }),
        ...(config.onlyWithSalary && { only_with_salary: 'true' }),
      })

      if (config.schedule?.length) {
        config.schedule.forEach((s) => params.append('schedule', s))
      }

      this.logger.debug(`Запрос hh.ru: страница ${page + 1}`)

      const response = await this.fetchWithRetry(
        `${this.hhApiBase}/vacancies?${params.toString()}`,
        { headers: { 'User-Agent': USER_AGENT } },
      )

      if (!response.ok) {
        this.logger.error(`hh.ru API вернул ${response.status}: ${await response.text()}`)
        break
      }

      const data = (await response.json()) as {
        items: Array<Record<string, unknown>>
        pages: number
        found: number
      }

      if (!data.items?.length) break

      for (const raw of data.items) {
        if (!passesHhItemFilters(raw)) continue
        vacancies.push(mapHhVacancyToVacancy(raw))
      }

      page++
      await this.delay(REQUEST_DELAY_MS)

      if (page >= data.pages) break
      if (vacancies.length >= maxResults) break
    }

    return vacancies.slice(0, maxResults)
  }

  /** Полное описание вакансии (для скоринга); ответ в snake_case */
  async getVacancyDetailsRaw(id: string): Promise<Record<string, unknown>> {
    await this.delay(REQUEST_DELAY_MS)
    const response = await this.fetchWithRetry(`${this.hhApiBase}/vacancies/${id}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!response.ok) {
      throw new Error(`hh.ru GET /vacancies/${id}: ${response.status}`)
    }
    return (await response.json()) as Record<string, unknown>
  }

  /** Текст вакансии для LLM: название + сниппет или полное описание */
  async buildVacancyTextForLlm(v: Vacancy): Promise<string> {
    const parts = [`${v.name}`, `Работодатель: ${v.employer.name}`, `Регион: ${v.area.name}`]
    if (v.snippet?.requirement) parts.push(`Требования: ${v.snippet.requirement}`)
    if (v.snippet?.responsibility) parts.push(`Обязанности: ${v.snippet.responsibility}`)
    try {
      const raw = await this.getVacancyDetailsRaw(v.id)
      const desc = raw.description
      if (typeof desc === 'string' && desc.length) {
        parts.push(`Описание:\n${stripHtml(desc).slice(0, 12_000)}`)
      }
    } catch (e) {
      this.logger.warn(`Не удалось подтянуть описание вакансии ${v.id}: ${(e as Error).message}`)
    }
    return parts.join('\n\n')
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms))
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastErr: unknown
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
        const res = await fetch(url, { ...init, signal: controller.signal })
        clearTimeout(timer)
        if (res.status === 429 || res.status >= 500) {
          await this.delay(REQUEST_DELAY_MS * 2 ** attempt)
          continue
        }
        return res
      } catch (e) {
        lastErr = e
        await this.delay(REQUEST_DELAY_MS * 2 ** attempt)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
