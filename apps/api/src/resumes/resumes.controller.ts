import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ResumeInputSchema } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import { OkResponseDto, ResumeDto, ResumeListDto } from '../common/dto/domain.dto.js'
import type { ResumeRecord } from '../database/schema/index.js'

import { ResumeInputDto } from './dto/resumes.dto.js'
import { ResumesService } from './resumes.service.js'

@ApiTags('resumes')
@ApiBearerAuth('access-token')
@Roles('job_seeker', 'admin')
@Controller('resumes')
export class ResumesController {
  constructor(private resumesService: ResumesService) {}

  @Get()
  @ApiOkResponse({ type: ResumeListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.resumesService.list(req.user.sub)
    return rows.map((row) => this.mapRow(row))
  }

  @Get(':id')
  @ApiOkResponse({ type: ResumeDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async get(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const row = await this.resumesService.getById(req.user.sub, id)
    return this.mapRow(row)
  }

  @Post()
  @ApiBody({ type: ResumeInputDto })
  @ApiOkResponse({ type: ResumeDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async create(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = ResumeInputSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const row = await this.resumesService.create(req.user.sub, parsed.data)
    return this.mapRow(row)
  }

  @Put(':id')
  @ApiBody({ type: ResumeInputDto })
  @ApiOkResponse({ type: ResumeDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const parsed = ResumeInputSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const row = await this.resumesService.update(req.user.sub, id, parsed.data)
    return this.mapRow(row)
  }

  @Delete(':id')
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async remove(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.resumesService.remove(req.user.sub, id)
    return { ok: true }
  }

  private mapRow(row: ResumeRecord) {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      skills: row.skills,
      experienceSummary: row.experienceSummary,
      experienceYears: row.experienceYears,
      education: row.education,
      desiredSalary: row.desiredSalary,
      desiredSalaryCurrency: row.desiredSalaryCurrency,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
