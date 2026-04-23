import { Controller, Get, Inject, Req } from '@nestjs/common'
import type { Request } from 'express'
import { and, count, desc, eq } from 'drizzle-orm'
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { searchRuns, vacancies } from '../database/schema/index.js'

@Controller('history')
export class HistoryController {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  @Get()
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.db
      .select()
      .from(searchRuns)
      .where(eq(searchRuns.userId, req.user.sub))
      .orderBy(desc(searchRuns.startedAt))
    return rows.map((r) => ({
      id: r.id,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
      status: r.status,
      totalFound: r.totalFound,
      aboveThreshold: r.aboveThreshold,
      errorMessage: r.errorMessage,
    }))
  }
}

@Controller('stats')
export class StatsController {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  @Get()
  async get(@Req() req: Request & { user: JwtPayload }) {
    const uid = req.user.sub
    const mine = and(eq(vacancies.userId, uid), eq(vacancies.hidden, false))

    const [totalRow, viewedRow, appliedRow] = await Promise.all([
      this.db.select({ n: count() }).from(vacancies).where(mine),
      this.db.select({ n: count() }).from(vacancies).where(and(mine, eq(vacancies.isViewed, true))),
      this.db.select({ n: count() }).from(vacancies).where(and(mine, eq(vacancies.isApplied, true))),
    ])

    return {
      total: totalRow[0]?.n ?? 0,
      viewed: viewedRow[0]?.n ?? 0,
      applied: appliedRow[0]?.n ?? 0,
    }
  }
}
