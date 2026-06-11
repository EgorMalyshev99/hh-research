import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
  AnalyzeResumeBodySchema,
  LlmRuntimeContextSchema,
  VacancyCreateSchema,
  VacancyListQuerySchema,
  VacancyUpdateSchema,
} from '@repo/shared'
import type { Request } from 'express'
import { z } from 'zod'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import {
  LlmResumeAnalysisResponseDto,
  OkResponseDto,
  StoredVacancyListDto,
  StoredVacancyRowDto,
  VacancyCreateBodyDto,
  VacancyUpdateBodyDto,
} from '../common/dto/domain.dto.js'
import { LlmService } from '../llm/llm.service.js'

import { mapVacancyRow, VacanciesService } from './vacancies.service.js'

@ApiTags('vacancies')
@ApiBearerAuth('access-token')
@Controller('vacancies')
export class VacanciesController {
  constructor(
    private vacanciesService: VacanciesService,
    private llmService: LlmService
  ) {}

  @Get()
  @Roles('job_seeker', 'admin')
  @ApiOkResponse({ type: StoredVacancyListDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async listCatalog(@Req() req: Request & { user: JwtPayload }, @Query() query: unknown) {
    const parsed = VacancyListQuerySchema.safeParse(query ?? {})
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())
    const rows = await this.vacanciesService.listCatalog(req.user.sub, parsed.data)
    return rows.map((r) => mapVacancyRow(r, r.userState))
  }

  @Get(':id')
  @Roles('job_seeker', 'admin')
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async getCatalog(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    const row = await this.vacanciesService.getCatalogById(req.user.sub, id)
    return mapVacancyRow(row, row.userState)
  }

  @Patch(':id/viewed')
  @Roles('job_seeker')
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async viewed(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.markViewed(req.user.sub, id)
    const row = await this.vacanciesService.getCatalogById(req.user.sub, id)
    return mapVacancyRow(row, row.userState)
  }

  @Patch(':id/applied')
  @Roles('job_seeker')
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async applied(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.markApplied(req.user.sub, id)
    const row = await this.vacanciesService.getCatalogById(req.user.sub, id)
    return mapVacancyRow(row, row.userState)
  }

  @Delete(':id')
  @Roles('job_seeker')
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async hide(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.hide(req.user.sub, id)
    return { ok: true }
  }

  @Post(':id/analyze-resume')
  @Roles('job_seeker')
  @ApiOkResponse({ type: LlmResumeAnalysisResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async analyzeResume(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const parsed = AnalyzeResumeBodySchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())

    const provider = parsed.data.llmProvider ?? 'gemini'
    const llmCtxParsed = LlmRuntimeContextSchema.safeParse({
      provider,
      model: parsed.data.llmModel?.trim() || defaultLlmModel(provider),
    })
    if (!llmCtxParsed.success) throw new BadRequestException(llmCtxParsed.error.flatten())

    const vacancy = await this.vacanciesService.getCatalogById(req.user.sub, id)
    const analysis = await this.llmService.analyzeResumeMatch(
      buildVacancyText(vacancy.data),
      parsed.data.resumeText,
      llmCtxParsed.data
    )
    await this.vacanciesService.setUserAnalysis(req.user.sub, id, {
      score: analysis.score,
      scoreReason: analysis.reason,
    })
    const updated = await this.vacanciesService.getCatalogById(req.user.sub, id)
    return {
      ...analysis,
      vacancy: mapVacancyRow(updated, updated.userState),
    }
  }

  @Post(':id/cover-letter')
  @Roles('job_seeker')
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async coverLetter(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const BodySchema = z.object({
      resumeText: z.string().min(50).max(50_000),
      llmProvider: z.enum(['gemini', 'openrouter', 'groq']).optional(),
      llmModel: z.string().min(1).optional(),
    })
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())

    const provider = parsed.data.llmProvider ?? 'gemini'
    const llmCtxParsed = LlmRuntimeContextSchema.safeParse({
      provider,
      model: parsed.data.llmModel?.trim() || defaultLlmModel(provider),
    })
    if (!llmCtxParsed.success) throw new BadRequestException(llmCtxParsed.error.flatten())

    const vacancy = await this.vacanciesService.getCatalogById(req.user.sub, id)
    const coverLetter = await this.llmService.generateCoverLetter(
      buildVacancyText(vacancy.data),
      parsed.data.resumeText,
      { tone: 'friendly', length: 'medium', language: 'ru' },
      llmCtxParsed.data
    )
    await this.vacanciesService.setCoverLetter(req.user.sub, id, coverLetter)
    const updated = await this.vacanciesService.getCatalogById(req.user.sub, id)
    return mapVacancyRow(updated, updated.userState)
  }
}

@ApiTags('my-vacancies')
@ApiBearerAuth('access-token')
@Controller('my-vacancies')
export class MyVacanciesController {
  constructor(private vacanciesService: VacanciesService) {}

  @Get()
  @Roles('employer')
  @ApiOkResponse({ type: StoredVacancyListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.vacanciesService.listMine(req.user.sub)
    return rows.map((r) => mapVacancyRow(r, null))
  }

  @Post()
  @Roles('employer')
  @ApiBody({ type: VacancyCreateBodyDto })
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async create(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = VacancyCreateSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())
    const row = await this.vacanciesService.createManual(req.user.sub, parsed.data)
    return mapVacancyRow(row, null)
  }

  @Put(':id')
  @Roles('employer')
  @ApiBody({ type: VacancyUpdateBodyDto })
  @ApiOkResponse({ type: StoredVacancyRowDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const parsed = VacancyUpdateSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())
    const row = await this.vacanciesService.updateManual(req.user.sub, id, parsed.data)
    return mapVacancyRow(row, null)
  }

  @Delete(':id')
  @Roles('employer')
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async remove(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.deleteManual(req.user.sub, id)
    return { ok: true }
  }
}

function buildVacancyText(data: {
  title: string
  employer: { name: string }
  location: { name: string }
  description: string
}): string {
  return [
    `${data.title}`,
    `Работодатель: ${data.employer.name}`,
    `Регион: ${data.location.name}`,
    data.description,
  ].join('\n\n')
}

function defaultLlmModel(provider: 'gemini' | 'openrouter' | 'groq'): string {
  if (provider === 'openrouter') return 'openai/gpt-4o-mini'
  if (provider === 'groq') return 'llama-3.1-8b-instant'
  return 'gemini-2.0-flash'
}
