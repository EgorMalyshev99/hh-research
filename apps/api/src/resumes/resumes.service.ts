import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { ResumeInput } from '@repo/shared'
import { and, desc, eq } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { resumes, type ResumeRecord } from '../database/schema/index.js'

@Injectable()
export class ResumesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async list(userId: number): Promise<ResumeRecord[]> {
    return this.db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.updatedAt), desc(resumes.id))
  }

  async getById(userId: number, id: number): Promise<ResumeRecord> {
    const [row] = await this.db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.id, id)))
    if (!row) {
      throw new NotFoundException('Резюме не найдено')
    }
    return row
  }

  async create(userId: number, body: ResumeInput): Promise<ResumeRecord> {
    const [row] = await this.db
      .insert(resumes)
      .values({
        userId,
        title: body.title.trim(),
        skills: body.skills.trim(),
        experienceSummary: body.experienceSummary.trim(),
        experienceYears: body.experienceYears,
        education: body.education?.trim() || null,
        desiredSalary: body.desiredSalary ?? null,
        desiredSalaryCurrency: body.desiredSalaryCurrency?.trim() || null,
      })
      .returning()
    if (!row) {
      throw new Error('Не удалось создать резюме')
    }
    return row
  }

  async update(userId: number, id: number, body: ResumeInput): Promise<ResumeRecord> {
    await this.getById(userId, id)
    const [row] = await this.db
      .update(resumes)
      .set({
        title: body.title.trim(),
        skills: body.skills.trim(),
        experienceSummary: body.experienceSummary.trim(),
        experienceYears: body.experienceYears,
        education: body.education?.trim() || null,
        desiredSalary: body.desiredSalary ?? null,
        desiredSalaryCurrency: body.desiredSalaryCurrency?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(resumes.userId, userId), eq(resumes.id, id)))
      .returning()
    if (!row) {
      throw new NotFoundException('Резюме не найдено')
    }
    return row
  }

  async remove(userId: number, id: number): Promise<void> {
    const deleted = await this.db
      .delete(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.id, id)))
      .returning({ id: resumes.id })
    if (!deleted.length) {
      throw new NotFoundException('Резюме не найдено')
    }
  }
}
