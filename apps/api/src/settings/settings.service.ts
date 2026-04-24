import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { CoverLetterConfig, SearchConfig, UpdateSettingsDto } from '@repo/shared'
import { CoverLetterConfigSchema, SearchConfigSchema } from '@repo/shared'
import { eq } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { settings, type Settings } from '../database/schema/index.js'

const defaultCoverLetter: CoverLetterConfig = CoverLetterConfigSchema.parse({})

@Injectable()
export class SettingsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getOrCreate(userId: number): Promise<Settings> {
    const [row] = await this.db.select().from(settings).where(eq(settings.userId, userId))
    if (row) return row

    const [created] = await this.db
      .insert(settings)
      .values({
        userId,
        coverLetterConfig: defaultCoverLetter,
      })
      .returning()
    if (!created) throw new Error('Не удалось создать настройки')
    return created
  }

  async update(userId: number, dto: UpdateSettingsDto): Promise<Settings> {
    await this.getOrCreate(userId)
    const patch: Partial<typeof settings.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (dto.searchConfig !== undefined) patch.searchConfig = dto.searchConfig
    if (dto.coverLetterConfig !== undefined) patch.coverLetterConfig = dto.coverLetterConfig
    if (dto.resumeMarkdown !== undefined) patch.resumeMarkdown = dto.resumeMarkdown
    if (dto.llmProvider !== undefined) patch.llmProvider = dto.llmProvider
    if (dto.llmModel !== undefined) patch.llmModel = dto.llmModel

    const [updated] = await this.db
      .update(settings)
      .set(patch)
      .where(eq(settings.userId, userId))
      .returning()
    if (!updated) throw new Error('Не удалось обновить настройки')
    return updated
  }

  /** Слияние: сохранённые настройки + частичное тело для запуска поиска */
  mergeSearchConfig(userId: number, saved: Settings, body: Partial<SearchConfig> | undefined): SearchConfig {
    const merged = {
      query: '',
      maxResults: 100,
      onlyWithSalary: false,
      relevanceThreshold: 70,
      ...saved.searchConfig,
      ...body,
    }
    if (!merged.query || merged.query.length < 1) {
      throw new BadRequestException(
        'Пустой поисковый запрос: задайте query в настройках или в теле POST /search/run',
      )
    }
    return SearchConfigSchema.parse(merged)
  }
}
