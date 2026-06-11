import { Controller, Get, Inject, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { and, count, desc, eq } from 'drizzle-orm'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import { VacancyImportRunHistoryListDto } from '../common/dto/domain.dto.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { vacancyImportRuns, vacancyUserStates } from '../database/schema/index.js'

@ApiTags('history')
@ApiBearerAuth('access-token')
@Controller('history')
@Roles('admin')
export class HistoryController {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  @Get()
  @ApiOkResponse({ type: VacancyImportRunHistoryListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.db
      .select()
      .from(vacancyImportRuns)
      .where(eq(vacancyImportRuns.userId, req.user.sub))
      .orderBy(desc(vacancyImportRuns.startedAt))
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      limitRequested: r.limitRequested,
      imported: r.imported,
      skipped: r.skipped,
      status: r.status,
      errorMessage: r.errorMessage,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
    }))
  }
}

@ApiTags('stats')
@ApiBearerAuth('access-token')
@Controller('stats')
@Roles('job_seeker', 'admin')
export class StatsController {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  @Get()
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async get(@Req() req: Request & { user: JwtPayload }) {
    const uid = req.user.sub
    const mine = and(eq(vacancyUserStates.userId, uid), eq(vacancyUserStates.hidden, false))

    const [totalRow, viewedRow, appliedRow] = await Promise.all([
      this.db.select({ n: count() }).from(vacancyUserStates).where(mine),
      this.db
        .select({ n: count() })
        .from(vacancyUserStates)
        .where(and(mine, eq(vacancyUserStates.isViewed, true))),
      this.db
        .select({ n: count() })
        .from(vacancyUserStates)
        .where(and(mine, eq(vacancyUserStates.isApplied, true))),
    ])

    return {
      total: totalRow[0]?.n ?? 0,
      viewed: viewedRow[0]?.n ?? 0,
      applied: appliedRow[0]?.n ?? 0,
    }
  }
}
