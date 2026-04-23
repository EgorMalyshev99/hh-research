import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import type { Vacancy } from '@repo/shared'
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
    },
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
