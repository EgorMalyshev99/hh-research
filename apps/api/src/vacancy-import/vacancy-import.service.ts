import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VacancyImportRunBodySchema, type VacancyImportRunResult } from '@repo/shared'
import { eq } from 'drizzle-orm'

import type { AppConfig } from '../config/config.schema.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { vacancyImportRuns } from '../database/schema/index.js'
import { VacanciesService } from '../vacancies/vacancies.service.js'

import { SuperjobProvider } from './providers/superjob.provider.js'
import { TrudvsemProvider } from './providers/trudvsem.provider.js'
import type { VacancyProvider } from './vacancy-provider.interface.js'

@Injectable()
export class VacancyImportService {
  private readonly logger = new Logger(VacancyImportService.name)
  private readonly providers: VacancyProvider[]

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    private vacanciesService: VacanciesService,
    trudvsem: TrudvsemProvider,
    superjob: SuperjobProvider,
    private configService: ConfigService<AppConfig, true>
  ) {
    this.providers = [trudvsem, superjob]
  }

  listProviders() {
    return this.providers.map((p) => ({
      id: p.id,
      label: p.label,
      enabled: p.isEnabled(),
      hint: p.hint,
    }))
  }

  getProvider(id: string): VacancyProvider {
    const provider = this.providers.find((p) => p.id === id)
    if (!provider) throw new BadRequestException('Неизвестный провайдер')
    if (!provider.isEnabled()) throw new BadRequestException(`Провайдер ${id} недоступен`)
    return provider
  }

  async run(userId: number, body: unknown): Promise<VacancyImportRunResult> {
    const parsed = VacancyImportRunBodySchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())

    const maxLimit = this.configService.getOrThrow('VACANCY_IMPORT_MAX_LIMIT', { infer: true })
    const limit = Math.min(parsed.data.limit, maxLimit)
    const provider = this.getProvider(parsed.data.provider)

    const [run] = await this.db
      .insert(vacancyImportRuns)
      .values({
        userId,
        provider: provider.id,
        limitRequested: limit,
        status: 'running',
      })
      .returning()

    if (!run) throw new BadRequestException('Не удалось создать запись импорта')

    const runId = run.id

    const errors: string[] = []
    let imported = 0
    let skipped = 0

    try {
      const items = await provider.fetch({
        limit,
        text: parsed.data.text,
        regionCode: parsed.data.regionCode,
        keyword: parsed.data.keyword,
        town: parsed.data.town,
      })

      for (const item of items) {
        try {
          const result = await this.vacanciesService.upsertImported(provider.id, item.externalId, item.data)
          if (result === 'imported') imported += 1
          else skipped += 1
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          errors.push(message)
          this.logger.warn(`Import item failed: ${message}`)
        }
      }

      await this.db
        .update(vacancyImportRuns)
        .set({
          status: 'completed',
          imported,
          skipped,
          finishedAt: new Date(),
        })
        .where(eq(vacancyImportRuns.id, runId))

      return { imported, skipped, errors }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await this.db
        .update(vacancyImportRuns)
        .set({
          status: 'failed',
          errorMessage: message,
          imported,
          skipped,
          finishedAt: new Date(),
        })
        .where(eq(vacancyImportRuns.id, runId))
      throw new BadRequestException(message)
    }
  }
}
