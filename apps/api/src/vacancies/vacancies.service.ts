import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { Vacancy } from '@repo/shared'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { vacancies, type VacancyRecord } from '../database/schema/index.js'

@Injectable()
export class VacanciesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async list(userId: number): Promise<VacancyRecord[]> {
    return this.db
      .select()
      .from(vacancies)
      .where(and(eq(vacancies.userId, userId), eq(vacancies.hidden, false)))
      .orderBy(desc(vacancies.createdAt))
  }

  async getById(userId: number, id: number): Promise<VacancyRecord> {
    const [row] = await this.db
      .select()
      .from(vacancies)
      .where(and(eq(vacancies.id, id), eq(vacancies.userId, userId), eq(vacancies.hidden, false)))
    if (!row) throw new NotFoundException('Вакансия не найдена')
    return row
  }

  async markViewed(userId: number, id: number): Promise<VacancyRecord> {
    await this.getById(userId, id)
    const [row] = await this.db
      .update(vacancies)
      .set({ isViewed: true })
      .where(and(eq(vacancies.id, id), eq(vacancies.userId, userId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }

  async markApplied(userId: number, id: number): Promise<VacancyRecord> {
    await this.getById(userId, id)
    const [row] = await this.db
      .update(vacancies)
      .set({ isApplied: true })
      .where(and(eq(vacancies.id, id), eq(vacancies.userId, userId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }

  async hide(userId: number, id: number): Promise<void> {
    await this.getById(userId, id)
    await this.db
      .update(vacancies)
      .set({ hidden: true })
      .where(and(eq(vacancies.id, id), eq(vacancies.userId, userId)))
  }

  async setCoverLetter(userId: number, id: number, coverLetter: string): Promise<VacancyRecord> {
    await this.getById(userId, id)
    const [row] = await this.db
      .update(vacancies)
      .set({ coverLetter })
      .where(and(eq(vacancies.id, id), eq(vacancies.userId, userId)))
      .returning()
    if (!row) throw new NotFoundException('Вакансия не найдена')
    return row
  }

  async findScoredHhIds(userId: number, hhIds: string[]): Promise<Set<string>> {
    if (!hhIds.length) return new Set<string>()
    const rows = await this.db
      .select({ hhId: vacancies.hhId })
      .from(vacancies)
      .where(
        and(
          eq(vacancies.userId, userId),
          inArray(vacancies.hhId, hhIds),
          isNotNull(vacancies.score),
          eq(vacancies.hidden, false)
        )
      )
    return new Set(rows.map((row) => row.hhId))
  }

  /** Вставка или обновление по (userId, hhId) */
  async upsertScored(
    userId: number,
    data: Vacancy,
    fields: {
      score: number
      scoreReason: string
      isRelevant: boolean
      coverLetter: string | null
      processedAt: Date
    }
  ): Promise<void> {
    await this.db
      .insert(vacancies)
      .values({
        userId,
        hhId: data.id,
        data,
        score: fields.score,
        scoreReason: fields.scoreReason,
        isRelevant: fields.isRelevant,
        coverLetter: fields.coverLetter,
        processedAt: fields.processedAt,
      })
      .onConflictDoUpdate({
        target: [vacancies.userId, vacancies.hhId],
        set: {
          data,
          score: fields.score,
          scoreReason: fields.scoreReason,
          isRelevant: fields.isRelevant,
          coverLetter: fields.coverLetter,
          processedAt: fields.processedAt,
          hidden: false,
        },
      })
  }
}
