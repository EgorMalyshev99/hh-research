import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { VacancyCreateDto, VacancyData, VacancyListQuery, VacancySource, VacancyUpdateDto } from '@repo/shared'
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

import { BlacklistService } from '../blacklist/blacklist.service.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import {
  vacancies,
  vacancyUserStates,
  type VacancyRecord,
  type VacancyUserStateRecord,
} from '../database/schema/index.js'

export interface VacancyWithUserState extends VacancyRecord {
  userState: VacancyUserStateRecord | null
}

@Injectable()
export class VacanciesService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    private blacklistService: BlacklistService
  ) {}

  async listCatalog(userId: number, query: VacancyListQuery): Promise<VacancyWithUserState[]> {
    const blacklist = await this.blacklistService.companyNamesLower(userId)
    const offset = (query.page - 1) * query.limit

    const conditions = [eq(vacancies.isPublished, true)]
    if (query.source) conditions.push(eq(vacancies.source, query.source))
    if (query.q?.trim()) {
      const pattern = `%${query.q.trim()}%`
      const textMatch = or(
        ilike(sql`${vacancies.data}->>'title'`, pattern),
        ilike(sql`${vacancies.data}->>'description'`, pattern)
      )
      if (textMatch) conditions.push(textMatch)
    }
    if (query.location?.trim()) {
      conditions.push(ilike(sql`${vacancies.data}->'location'->>'name'`, `%${query.location.trim()}%`))
    }

    const rows = await this.db
      .select({ vacancy: vacancies, userState: vacancyUserStates })
      .from(vacancies)
      .leftJoin(
        vacancyUserStates,
        and(eq(vacancyUserStates.vacancyId, vacancies.id), eq(vacancyUserStates.userId, userId))
      )
      .where(and(...conditions))
      .orderBy(desc(vacancies.createdAt))
      .limit(query.limit)
      .offset(offset)

    return rows
      .filter((r) => {
        const name = r.vacancy.data.employer.name.toLowerCase()
        if (r.userState?.hidden) return false
        return !blacklist.some((b) => name.includes(b.toLowerCase()))
      })
      .map((r) => ({ ...r.vacancy, userState: r.userState }))
  }

  async getCatalogById(userId: number, id: number): Promise<VacancyWithUserState> {
    const [row] = await this.db
      .select({ vacancy: vacancies, userState: vacancyUserStates })
      .from(vacancies)
      .leftJoin(
        vacancyUserStates,
        and(eq(vacancyUserStates.vacancyId, vacancies.id), eq(vacancyUserStates.userId, userId))
      )
      .where(and(eq(vacancies.id, id), eq(vacancies.isPublished, true)))

    if (!row || row.userState?.hidden) throw new NotFoundException('Вакансия не найдена')
    return { ...row.vacancy, userState: row.userState }
  }

  async listMine(ownerUserId: number): Promise<VacancyRecord[]> {
    return this.db
      .select()
      .from(vacancies)
      .where(and(eq(vacancies.ownerUserId, ownerUserId), eq(vacancies.source, 'manual')))
      .orderBy(desc(vacancies.createdAt))
  }

  async createManual(ownerUserId: number, dto: VacancyCreateDto): Promise<VacancyRecord> {
    const data = dtoToVacancyData(dto)
    const [row] = await this.db
      .insert(vacancies)
      .values({
        source: 'manual',
        externalId: null,
        ownerUserId,
        data,
        isPublished: true,
      })
      .returning()
    if (!row) throw new Error('Не удалось создать вакансию')
    return row
  }

  async updateManual(ownerUserId: number, id: number, dto: VacancyUpdateDto): Promise<VacancyRecord> {
    const existing = await this.getOwnedManual(ownerUserId, id)
    const merged = mergeVacancyUpdate(existing.data, dto)
    const [row] = await this.db
      .update(vacancies)
      .set({ data: merged, updatedAt: new Date() })
      .where(and(eq(vacancies.id, id), eq(vacancies.ownerUserId, ownerUserId)))
      .returning()
    if (!row) throw new NotFoundException('Вакансия не найдена')
    return row
  }

  async deleteManual(ownerUserId: number, id: number): Promise<void> {
    await this.getOwnedManual(ownerUserId, id)
    await this.db
      .delete(vacancies)
      .where(and(eq(vacancies.id, id), eq(vacancies.ownerUserId, ownerUserId), eq(vacancies.source, 'manual')))
  }

  async listAdmin(source?: VacancySource): Promise<VacancyRecord[]> {
    if (source) {
      return this.db.select().from(vacancies).where(eq(vacancies.source, source)).orderBy(desc(vacancies.createdAt))
    }
    return this.db.select().from(vacancies).orderBy(desc(vacancies.createdAt))
  }

  async deleteAdmin(id: number): Promise<void> {
    const result = await this.db.delete(vacancies).where(eq(vacancies.id, id)).returning({ id: vacancies.id })
    if (!result.length) throw new NotFoundException('Вакансия не найдена')
  }

  async upsertImported(source: VacancySource, externalId: string, data: VacancyData): Promise<'imported' | 'skipped'> {
    const inserted = await this.db
      .insert(vacancies)
      .values({
        source,
        externalId,
        ownerUserId: null,
        data,
        isPublished: true,
      })
      .onConflictDoNothing({ target: [vacancies.source, vacancies.externalId] })
      .returning({ id: vacancies.id })

    return inserted.length ? 'imported' : 'skipped'
  }

  private async getOwnedManual(ownerUserId: number, id: number): Promise<VacancyRecord> {
    const [row] = await this.db
      .select()
      .from(vacancies)
      .where(
        and(
          eq(vacancies.id, id),
          eq(vacancies.ownerUserId, ownerUserId),
          eq(vacancies.source, 'manual'),
          isNull(vacancies.externalId)
        )
      )
    if (!row) throw new NotFoundException('Вакансия не найдена')
    return row
  }

  async ensureUserState(userId: number, vacancyId: number): Promise<VacancyUserStateRecord> {
    const [existing] = await this.db
      .select()
      .from(vacancyUserStates)
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))

    if (existing) return existing

    const [created] = await this.db.insert(vacancyUserStates).values({ userId, vacancyId }).returning()
    if (!created) throw new Error('Не удалось создать состояние вакансии')
    return created
  }

  async markViewed(userId: number, vacancyId: number): Promise<VacancyUserStateRecord> {
    await this.getCatalogById(userId, vacancyId)
    await this.ensureUserState(userId, vacancyId)
    const [row] = await this.db
      .update(vacancyUserStates)
      .set({ isViewed: true, updatedAt: new Date() })
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }

  async markApplied(userId: number, vacancyId: number): Promise<VacancyUserStateRecord> {
    await this.getCatalogById(userId, vacancyId)
    await this.ensureUserState(userId, vacancyId)
    const [row] = await this.db
      .update(vacancyUserStates)
      .set({ isApplied: true, updatedAt: new Date() })
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }

  async hide(userId: number, vacancyId: number): Promise<void> {
    await this.getCatalogById(userId, vacancyId)
    await this.ensureUserState(userId, vacancyId)
    await this.db
      .update(vacancyUserStates)
      .set({ hidden: true, updatedAt: new Date() })
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))
  }

  async setUserAnalysis(
    userId: number,
    vacancyId: number,
    fields: { score: number; scoreReason: string }
  ): Promise<VacancyUserStateRecord> {
    await this.getCatalogById(userId, vacancyId)
    await this.ensureUserState(userId, vacancyId)
    const [row] = await this.db
      .update(vacancyUserStates)
      .set({
        score: fields.score,
        scoreReason: fields.scoreReason,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }

  async setCoverLetter(userId: number, vacancyId: number, coverLetter: string): Promise<VacancyUserStateRecord> {
    await this.getCatalogById(userId, vacancyId)
    await this.ensureUserState(userId, vacancyId)
    const [row] = await this.db
      .update(vacancyUserStates)
      .set({ coverLetter, updatedAt: new Date() })
      .where(and(eq(vacancyUserStates.userId, userId), eq(vacancyUserStates.vacancyId, vacancyId)))
      .returning()
    if (!row) throw new NotFoundException()
    return row
  }
}

function dtoToVacancyData(dto: VacancyCreateDto): VacancyData {
  return {
    title: dto.title,
    employer: { name: dto.employerName },
    location: { name: dto.locationName },
    description: dto.description,
    url: dto.url,
    salary:
      dto.salaryFrom || dto.salaryTo
        ? {
            from: dto.salaryFrom ?? null,
            to: dto.salaryTo ?? null,
            currency: dto.salaryCurrency ?? 'RUR',
            gross: null,
          }
        : null,
    tags: dto.tags,
    publishedAt: new Date().toISOString(),
  }
}

function mergeVacancyUpdate(existing: VacancyData, dto: VacancyUpdateDto): VacancyData {
  return {
    ...existing,
    title: dto.title ?? existing.title,
    employer: { name: dto.employerName ?? existing.employer.name, logoUrl: existing.employer.logoUrl },
    location: { name: dto.locationName ?? existing.location.name, regionCode: existing.location.regionCode },
    description: dto.description ?? existing.description,
    url: dto.url ?? existing.url,
    tags: dto.tags ?? existing.tags,
    salary:
      dto.salaryFrom !== undefined || dto.salaryTo !== undefined || dto.salaryCurrency !== undefined
        ? {
            from: dto.salaryFrom ?? existing.salary?.from ?? null,
            to: dto.salaryTo ?? existing.salary?.to ?? null,
            currency: dto.salaryCurrency ?? existing.salary?.currency ?? 'RUR',
            gross: existing.salary?.gross ?? null,
          }
        : existing.salary,
    publishedAt: existing.publishedAt,
  }
}

export function mapVacancyRow(vacancy: VacancyRecord, userState: VacancyUserStateRecord | null | undefined) {
  return {
    id: vacancy.id,
    source: vacancy.source,
    externalId: vacancy.externalId,
    ownerUserId: vacancy.ownerUserId,
    data: vacancy.data,
    isPublished: vacancy.isPublished,
    createdAt: vacancy.createdAt.toISOString(),
    userState: userState
      ? {
          isViewed: userState.isViewed,
          isApplied: userState.isApplied,
          hidden: userState.hidden,
          score: userState.score,
          scoreReason: userState.scoreReason,
          coverLetter: userState.coverLetter,
          processedAt: userState.processedAt?.toISOString() ?? null,
        }
      : undefined,
  }
}
