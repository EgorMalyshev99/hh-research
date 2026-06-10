import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { VacancyData } from '@repo/shared'
import { z } from 'zod'

import type { AppConfig } from '../../config/config.schema.js'
import type { NormalizedVacancy, VacancyImportParams, VacancyProvider } from '../vacancy-provider.interface.js'

const SuperjobVacancySchema = z.object({
  id: z.number(),
  profession: z.string(),
  link: z.string().url(),
  payment_from: z.number().optional(),
  payment_to: z.number().optional(),
  currency: z.string().optional(),
  firm_name: z.string().optional(),
  town: z.object({ title: z.string().optional() }).optional(),
  work: z.string().optional(),
  candidat: z.string().optional(),
  date_published: z.number().optional(),
})

const SuperjobResponseSchema = z.object({
  objects: z.array(SuperjobVacancySchema).optional(),
  total: z.number().optional(),
})

@Injectable()
export class SuperjobProvider implements VacancyProvider {
  readonly id = 'superjob' as const
  readonly label = 'SuperJob'
  readonly hint = 'Укажите SUPERJOB_APP_ID в .env'
  private readonly logger = new Logger(SuperjobProvider.name)

  constructor(private configService: ConfigService<AppConfig, true>) {}

  isEnabled(): boolean {
    return Boolean(this.configService.get('SUPERJOB_APP_ID')?.trim())
  }

  async fetch(params: VacancyImportParams): Promise<NormalizedVacancy[]> {
    const appId = this.configService.get('SUPERJOB_APP_ID')?.trim()
    if (!appId) throw new Error('SUPERJOB_APP_ID не задан')

    const base = this.configService.getOrThrow('SUPERJOB_API_BASE').replace(/\/$/, '')
    const collected: NormalizedVacancy[] = []
    let page = 0

    while (collected.length < params.limit) {
      const remaining = params.limit - collected.length
      const count = Math.min(100, remaining)
      const url = new URL(`${base}/vacancies/`)
      url.searchParams.set('page', String(page))
      url.searchParams.set('count', String(count))
      if (params.keyword?.trim()) url.searchParams.set('keyword', params.keyword.trim())
      if (params.town) url.searchParams.set('town', String(params.town))

      this.logger.debug(`SuperJob fetch: ${url}`)
      const response = await fetch(url.toString(), {
        headers: { 'X-Api-App-Id': appId },
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`SuperJob HTTP ${response.status}`)

      const json: unknown = await response.json()
      const parsed = SuperjobResponseSchema.safeParse(json)
      if (!parsed.success) break

      const objects = parsed.data.objects ?? []
      if (!objects.length) break

      for (const obj of objects) {
        if (collected.length >= params.limit) break
        collected.push(this.normalize(obj))
      }

      if (objects.length < count) break
      page += 1
    }

    return collected
  }

  private normalize(obj: z.infer<typeof SuperjobVacancySchema>): NormalizedVacancy {
    const description = [obj.work, obj.candidat].filter(Boolean).join('\n\n') || obj.profession
    const publishedAt = obj.date_published
      ? new Date(obj.date_published * 1000).toISOString()
      : new Date().toISOString()

    const data: VacancyData = {
      title: obj.profession,
      employer: { name: obj.firm_name ?? 'Не указан' },
      location: { name: obj.town?.title ?? 'Россия' },
      description,
      url: obj.link,
      salary:
        obj.payment_from || obj.payment_to
          ? {
              from: obj.payment_from ?? null,
              to: obj.payment_to ?? null,
              currency: obj.currency ?? 'RUR',
              gross: null,
            }
          : null,
      publishedAt,
    }

    return { externalId: String(obj.id), data }
  }
}
