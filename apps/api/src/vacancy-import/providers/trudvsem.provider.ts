import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { VacancyData } from '@repo/shared'
import { z } from 'zod'

import type { AppConfig } from '../../config/config.schema.js'
import type { NormalizedVacancy, VacancyImportParams, VacancyProvider } from '../vacancy-provider.interface.js'

const TrudvsemVacancySchema = z.object({
  id: z.string().optional(),
  vacancy: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      'job-name': z.string().optional(),
      job_name: z.string().optional(),
      name: z.string().optional(),
      company: z
        .object({
          name: z.string().optional(),
          companycode: z.string().optional(),
        })
        .optional(),
      region: z
        .object({
          name: z.string().optional(),
          code: z.string().optional(),
        })
        .optional(),
      salary: z.string().optional(),
      'creation-date': z.string().optional(),
      creation_date: z.string().optional(),
      'job-duty': z.string().optional(),
      job_duty: z.string().optional(),
      requirement: z
        .object({
          experience: z.string().optional(),
          education: z.string().optional(),
        })
        .optional(),
    })
    .passthrough()
    .optional(),
})

const TrudvsemResponseSchema = z.object({
  status: z.string().optional(),
  results: z
    .object({
      vacancies: z.array(TrudvsemVacancySchema).optional(),
    })
    .optional(),
})

@Injectable()
export class TrudvsemProvider implements VacancyProvider {
  readonly id = 'trudvsem' as const
  readonly label = 'Работа России'
  private readonly logger = new Logger(TrudvsemProvider.name)

  constructor(private configService: ConfigService<AppConfig, true>) {}

  isEnabled(): boolean {
    return true
  }

  async fetch(params: VacancyImportParams): Promise<NormalizedVacancy[]> {
    const base = this.configService.getOrThrow('TRUDVSEM_API_BASE').replace(/\/$/, '')
    const collected: NormalizedVacancy[] = []
    let offset = 0
    const pageSize = 100

    while (collected.length < params.limit) {
      const remaining = params.limit - collected.length
      const limit = Math.min(pageSize, remaining)
      const url = new URL(`${base}/vacancies`)
      url.searchParams.set('offset', String(offset))
      url.searchParams.set('limit', String(limit))
      if (params.text?.trim()) url.searchParams.set('text', params.text.trim())
      if (params.regionCode?.trim()) {
        const regionUrl = new URL(`${base}/vacancies/region/${encodeURIComponent(params.regionCode.trim())}`)
        regionUrl.searchParams.set('offset', String(offset))
        regionUrl.searchParams.set('limit', String(limit))
        if (params.text?.trim()) regionUrl.searchParams.set('text', params.text.trim())
        const regionItems = await this.fetchPage(regionUrl.toString())
        if (!regionItems.length) break
        collected.push(...regionItems.slice(0, remaining))
        if (regionItems.length < limit) break
        offset += limit
        continue
      }

      const items = await this.fetchPage(url.toString())
      if (!items.length) break
      collected.push(...items.slice(0, remaining))
      if (items.length < limit) break
      offset += limit
    }

    return collected.slice(0, params.limit)
  }

  private async fetchPage(url: string): Promise<NormalizedVacancy[]> {
    this.logger.debug(`Trudvsem fetch: ${url}`)
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) {
      throw new Error(`Trudvsem HTTP ${response.status}`)
    }
    const json: unknown = await response.json()
    const parsed = TrudvsemResponseSchema.safeParse(json)
    if (!parsed.success) {
      this.logger.warn(`Trudvsem parse warning: ${parsed.error.message}`)
      return []
    }
    const list = parsed.data.results?.vacancies ?? []
    const result: NormalizedVacancy[] = []
    for (const item of list) {
      const normalized = this.normalize(item)
      if (normalized) result.push(normalized)
    }
    return result
  }

  private normalize(item: z.infer<typeof TrudvsemVacancySchema>): NormalizedVacancy | null {
    const v = item.vacancy
    if (!v) return null

    const companyCode = v.company?.companycode ?? 'unknown'
    const vacancyId = v.id ?? item.id
    if (vacancyId === undefined || vacancyId === null) return null

    const externalId = `${companyCode}/${String(vacancyId)}`
    const title = v['job-name'] ?? v.job_name ?? v.name ?? 'Без названия'
    const employerName = v.company?.name ?? 'Не указан'
    const locationName = v.region?.name ?? 'Россия'
    const descriptionParts = [v['job-duty'], v.job_duty, v.requirement?.experience, v.requirement?.education].filter(
      Boolean
    )
    const description = descriptionParts.join('\n\n') || title
    const publishedRaw = v['creation-date'] ?? v.creation_date
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : new Date().toISOString()
    const url = `https://trudvsem.ru/vacancy/vacancy/${encodeURIComponent(companyCode)}/${encodeURIComponent(String(vacancyId))}`

    const data: VacancyData = {
      title,
      employer: { name: employerName },
      location: { name: locationName, regionCode: v.region?.code },
      description,
      url,
      salary: parseSalary(v.salary),
      publishedAt,
    }

    return { externalId, data }
  }
}

function parseSalary(raw: string | undefined): VacancyData['salary'] {
  if (!raw?.trim()) return null
  const numbers = raw.match(/\d+/g)?.map(Number) ?? []
  if (!numbers.length) return null
  return {
    from: numbers[0] ?? null,
    to: numbers[1] ?? numbers[0] ?? null,
    currency: 'RUR',
    gross: null,
  }
}
