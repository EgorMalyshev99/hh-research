import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import type { VacancyRecord } from '../database/schema/index.js'

import { VacanciesService } from './vacancies.service.js'

@ApiTags('vacancies')
@ApiBearerAuth('access-token')
@Controller('vacancies')
export class VacanciesController {
  constructor(private vacanciesService: VacanciesService) {}

  @Get()
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.vacanciesService.list(req.user.sub)
    return rows.map((r) => this.mapRow(r))
  }

  @Get(':id')
  async get(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const r = await this.vacanciesService.getById(req.user.sub, id)
    return this.mapRow(r)
  }

  @Patch(':id/viewed')
  async viewed(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const r = await this.vacanciesService.markViewed(req.user.sub, id)
    return this.mapRow(r)
  }

  @Patch(':id/applied')
  async applied(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const r = await this.vacanciesService.markApplied(req.user.sub, id)
    return this.mapRow(r)
  }

  @Delete(':id')
  async remove(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.hide(req.user.sub, id)
    return { ok: true }
  }

  private mapRow(r: VacancyRecord) {
    return {
      id: r.id,
      hhId: r.hhId,
      data: r.data,
      score: r.score,
      scoreReason: r.scoreReason,
      isRelevant: r.isRelevant,
      coverLetter: r.coverLetter,
      processedAt: r.processedAt?.toISOString() ?? null,
      isViewed: r.isViewed,
      isApplied: r.isApplied,
      createdAt: r.createdAt.toISOString(),
    }
  }
}
