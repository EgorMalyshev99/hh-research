import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RunSearchBodySchema, type RunSearchBody, type ScheduleFilter, type Vacancy } from '@repo/shared'

import type { AppConfig } from '../config/config.schema.js'

const CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_DELAY_MS = 350
const MAX_RETRIES = 3
const MAX_PER_PAGE = 100
const HH_TIMEOUT_MS = 20_000
const IT_PROFESSIONAL_ROLE_IDS = [
  '10',
  '12',
  '25',
  '34',
  '36',
  '73',
  '96',
  '104',
  '107',
  '112',
  '113',
  '114',
  '116',
  '121',
  '124',
  '125',
  '126',
  '148',
  '150',
  '155',
  '156',
  '157',
  '160',
  '164',
  '165',
] as const

interface HhPageResponse {
  items?: Record<string, unknown>[]
  pages?: number
}

interface HhAreaNode {
  id: string | number
  name: string
  areas?: HhAreaNode[]
}

@Injectable()
export class HhService {
  private readonly cache = new Map<string, { expiresAt: number; data: Vacancy[] }>()
  private readonly areasCache = new Map<string, { expiresAt: number; data: HhArea[] }>()
  private lastRequestAt = 0

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async searchVacancies(body: unknown): Promise<Vacancy[]> {
    const parsed = RunSearchBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException({ message: parsed.error.flatten() }, HttpStatus.BAD_REQUEST)
    }
    const payload = parsed.data
    const cacheKey = JSON.stringify({
      query: payload.query,
      area: payload.area,
      salary: payload.salary,
      experience: payload.experience,
      onlyWithSalary: payload.onlyWithSalary,
      scheduleFilter: payload.scheduleFilter ?? [],
      schedule: payload.schedule ?? [],
      maxResults: payload.maxResults ?? 100,
    })

    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.data

    const maxResults = Math.min(payload.maxResults ?? 100, 200)
    const perPage = Math.min(MAX_PER_PAGE, maxResults)
    const maxPage = Math.ceil(2000 / perPage) - 1
    const vacancies: Vacancy[] = []
    let page = 0

    while (vacancies.length < maxResults && page <= maxPage) {
      const params = new URLSearchParams({
        text: String(payload.query ?? ''),
        per_page: String(perPage),
        page: String(page),
        ...(payload.area && { area: payload.area }),
        ...(payload.salary !== undefined && { salary: String(payload.salary) }),
        ...(payload.experience && { experience: payload.experience }),
        ...(payload.onlyWithSalary && { only_with_salary: 'true' }),
      })
      const apiSchedule = payload.scheduleFilter?.length
        ? mapScheduleFilterToApi(payload.scheduleFilter)
        : (payload.schedule ?? [])
      apiSchedule.forEach((value) => params.append('schedule', value))
      IT_PROFESSIONAL_ROLE_IDS.forEach((id) => params.append('professional_role', id))

      const data = await this.fetchWithRetry<HhPageResponse>(`/vacancies?${params.toString()}`)
      const items = data.items ?? []
      if (!items.length) break
      for (const raw of items) {
        if (!passesHhItemFilters(raw)) continue
        const mapped = mapHhVacancyToVacancy(raw)
        vacancies.push(mapped)
        if (vacancies.length >= maxResults) break
      }
      page += 1
      if (page >= (data.pages ?? 0)) break
    }

    const result = vacancies.slice(0, maxResults)
    this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  }

  async fetchAreas(): Promise<HhArea[]> {
    const key = 'areas'
    const cached = this.areasCache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.data
    const tree = await this.fetchWithRetry<HhAreaNode[]>('/areas')
    const flat: HhArea[] = []
    const walk = (nodes: HhAreaNode[], parentId: string | null) => {
      for (const node of nodes) {
        flat.push({ id: String(node.id), name: String(node.name), parentId })
        if (node.areas?.length) walk(node.areas, String(node.id))
      }
    }
    walk(tree, null)
    this.areasCache.set(key, { data: flat, expiresAt: Date.now() + CACHE_TTL_MS })
    return flat
  }

  private async fetchWithRetry<T>(path: string): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        await this.waitForRateLimit()
        const response = await fetch(`${this.configService.getOrThrow('HH_API_BASE')}${path}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': this.configService.getOrThrow('HH_USER_AGENT'),
            'HH-User-Agent': this.configService.getOrThrow('HH_USER_AGENT'),
          },
          signal: AbortSignal.timeout(HH_TIMEOUT_MS),
        })
        if (response.ok) return (await response.json()) as T
        if (response.status === 429 || response.status >= 500) {
          await delay(REQUEST_DELAY_MS * 2 ** attempt)
          continue
        }
        await this.throwHhHttpError(response)
      } catch (error) {
        lastError = error
        if (error instanceof HttpException) throw error
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
          throw new HttpException(
            { code: 'HH_TIMEOUT', message: 'Превышено время ожидания ответа hh.ru' },
            HttpStatus.GATEWAY_TIMEOUT
          )
        }
        await delay(REQUEST_DELAY_MS * 2 ** attempt)
      }
    }
    if (lastError instanceof HttpException) throw lastError
    throw new HttpException(
      { code: 'HH_NETWORK', message: `Ошибка сети при обращении к hh.ru: ${String(lastError ?? 'unknown')}` },
      HttpStatus.BAD_GATEWAY
    )
  }

  private async throwHhHttpError(response: Response): Promise<never> {
    const bodyText = await response.text()
    const info = parseHhError(bodyText)
    if (response.status === 403) {
      throw new HttpException(
        {
          code: 'HH_FORBIDDEN',
          message: `hh.ru отклонил запрос (403). Проверьте User-Agent/IP. ${info.messagePart}`.trim(),
          hhStatus: response.status,
          hhRequestId: info.requestId,
        },
        HttpStatus.BAD_GATEWAY
      )
    }
    if (response.status === 429) {
      throw new HttpException(
        {
          code: 'HH_RATE_LIMIT',
          message: `hh.ru ограничил частоту запросов (429). Попробуйте позже. ${info.messagePart}`.trim(),
          hhStatus: response.status,
          hhRequestId: info.requestId,
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }
    throw new HttpException(
      {
        code: 'HH_UPSTREAM',
        message: `hh.ru вернул ошибку ${response.status}. ${info.messagePart}`.trim(),
        hhStatus: response.status,
        hhRequestId: info.requestId,
      },
      HttpStatus.BAD_GATEWAY
    )
  }

  private async waitForRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt
    if (elapsed < REQUEST_DELAY_MS) {
      await delay(REQUEST_DELAY_MS - elapsed)
    }
    this.lastRequestAt = Date.now()
  }
}

export interface HhArea {
  id: string
  name: string
  parentId: string | null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseHhError(bodyText: string): { requestId?: string; messagePart: string } {
  try {
    const parsed = JSON.parse(bodyText) as { request_id?: unknown; description?: unknown; errors?: unknown }
    const requestId = typeof parsed.request_id === 'string' ? parsed.request_id : undefined
    const description = typeof parsed.description === 'string' ? parsed.description : ''
    return { requestId, messagePart: description ? `Детали: ${description}` : '' }
  } catch {
    return { messagePart: bodyText.slice(0, 200) }
  }
}

function mapHhVacancyToVacancy(raw: Record<string, unknown>): Vacancy {
  const employer = (raw.employer ?? {}) as Record<string, unknown>
  const logoUrls = employer.logo_urls as Record<string, unknown> | undefined
  const salary = raw.salary as Record<string, unknown> | null | undefined
  const area = (raw.area ?? { id: '', name: '' }) as Record<string, unknown>
  const snippet = raw.snippet as Record<string, unknown> | undefined
  const schedule = raw.schedule as Record<string, unknown> | null | undefined
  const experience = raw.experience as Record<string, unknown> | null | undefined
  const employment = raw.employment as Record<string, unknown> | null | undefined

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    employer: {
      id: employer.id !== undefined ? Number(employer.id) : undefined,
      name: String(employer.name ?? ''),
      logoUrls: logoUrls?.original
        ? { original: String(logoUrls.original) }
        : logoUrls?.['90']
          ? { original: String(logoUrls['90']) }
          : undefined,
    },
    salary: salary
      ? {
          from: salary.from !== undefined && salary.from !== null ? Number(salary.from) : null,
          to: salary.to !== undefined && salary.to !== null ? Number(salary.to) : null,
          currency: String(salary.currency ?? 'RUR'),
          gross: salary.gross === null || salary.gross === undefined ? null : Boolean(salary.gross),
        }
      : null,
    area: { id: String(area.id ?? ''), name: String(area.name ?? '') },
    publishedAt: normalizePublishedAt(raw.published_at),
    url: String(raw.url ?? ''),
    alternateUrl: String(raw.alternate_url ?? raw.url ?? ''),
    snippet: snippet
      ? {
          requirement: snippet.requirement !== undefined ? String(snippet.requirement) : null,
          responsibility: snippet.responsibility !== undefined ? String(snippet.responsibility) : null,
        }
      : undefined,
    schedule: schedule ? { id: String(schedule.id ?? ''), name: String(schedule.name ?? '') } : null,
    experience: experience ? { id: String(experience.id ?? ''), name: String(experience.name ?? '') } : null,
    employment: employment ? { id: String(employment.id ?? ''), name: String(employment.name ?? '') } : null,
  }
}

function normalizePublishedAt(value: unknown): string {
  if (typeof value === 'string' && value.length) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return new Date().toISOString()
}

function passesHhItemFilters(raw: Record<string, unknown>): boolean {
  if (raw.has_test === true) return false
  const type = raw.type as { id?: string } | undefined
  if (type?.id === 'direct') return false
  return true
}

function mapScheduleFilterToApi(filters: ScheduleFilter[]): string[] {
  const set = new Set<string>()
  for (const filter of filters) {
    if (filter === 'remote') set.add('remote')
    if (filter === 'office' || filter === 'hybrid') set.add('fullDay')
    if (filter === 'flexible') set.add('flexible')
  }
  return [...set]
}
