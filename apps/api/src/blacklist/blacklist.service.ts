import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { CreateBlacklistEntryDto } from '@repo/shared'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { blacklist, type BlacklistRow } from '../database/schema/index.js'

@Injectable()
export class BlacklistService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async list(userId: number): Promise<BlacklistRow[]> {
    return this.db.select().from(blacklist).where(eq(blacklist.userId, userId))
  }

  async add(userId: number, dto: CreateBlacklistEntryDto): Promise<BlacklistRow> {
    const [row] = await this.db
      .insert(blacklist)
      .values({ userId, companyName: dto.companyName.trim() })
      .returning()
    if (!row) throw new Error('Не удалось добавить запись')
    return row
  }

  async remove(userId: number, id: number): Promise<void> {
    const deleted = await this.db
      .delete(blacklist)
      .where(and(eq(blacklist.id, id), eq(blacklist.userId, userId)))
      .returning({ id: blacklist.id })
    if (!deleted.length) {
      throw new NotFoundException('Запись не найдена')
    }
  }

  async companyNamesLower(userId: number): Promise<string[]> {
    const rows = await this.list(userId)
    return rows.map((r) => r.companyName.toLowerCase())
  }
}
