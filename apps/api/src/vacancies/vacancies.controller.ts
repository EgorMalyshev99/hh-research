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
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LlmRuntimeContextSchema } from '@repo/shared'
import type { Request } from 'express'
import { z } from 'zod'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import type { VacancyRecord } from '../database/schema/index.js'
import { LlmService } from '../llm/llm.service.js'
import { ResumesService } from '../resumes/resumes.service.js'

import { VacanciesService } from './vacancies.service.js'

@ApiTags('vacancies')
@ApiBearerAuth('access-token')
@Controller('vacancies')
export class VacanciesController {
  constructor(
    private vacanciesService: VacanciesService,
    private resumesService: ResumesService,
    private llmService: LlmService
  ) {}

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

  @Post(':id/cover-letter')
  async coverLetter(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const BodySchema = z.object({
      resumeId: z.number().int().positive(),
      llmProvider: z.enum(['gemini', 'openrouter', 'groq']).optional(),
      llmModel: z.string().min(1).optional(),
    })
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const provider = parsed.data.llmProvider ?? 'gemini'
    const llmCtxParsed = LlmRuntimeContextSchema.safeParse({
      provider,
      model: parsed.data.llmModel?.trim() || defaultLlmModel(provider),
    })
    if (!llmCtxParsed.success) {
      throw new BadRequestException(llmCtxParsed.error.flatten())
    }

    const vacancy = await this.vacanciesService.getById(req.user.sub, id)
    const resume = await this.resumesService.getById(req.user.sub, parsed.data.resumeId)
    const coverLetter = await this.llmService.generateCoverLetter(
      buildVacancyTextForLlm(vacancy),
      buildResumeText(resume),
      { tone: 'friendly', length: 'medium', language: 'ru' },
      llmCtxParsed.data
    )
    const updated = await this.vacanciesService.setCoverLetter(req.user.sub, id, coverLetter)
    return this.mapRow(updated)
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

function buildVacancyTextForLlm(vacancy: VacancyRecord): string {
  const data = vacancy.data
  const parts = [`${data.name}`, `Работодатель: ${data.employer.name}`, `Регион: ${data.area.name}`]
  if (data.snippet?.requirement) parts.push(`Требования: ${data.snippet.requirement}`)
  if (data.snippet?.responsibility) parts.push(`Обязанности: ${data.snippet.responsibility}`)
  return parts.join('\n\n')
}

function buildResumeText(resume: {
  title: string
  skills: string
  experienceSummary: string
  experienceYears: number
  education: string | null
  desiredSalary: number | null
  desiredSalaryCurrency: string | null
}): string {
  const parts = [
    `Должность: ${resume.title}`,
    `Навыки: ${resume.skills}`,
    `Опыт (лет): ${resume.experienceYears}`,
    `Опыт: ${resume.experienceSummary}`,
  ]
  if (resume.education) parts.push(`Образование: ${resume.education}`)
  if (resume.desiredSalary) {
    parts.push(`Ожидаемая зарплата: ${resume.desiredSalary} ${resume.desiredSalaryCurrency ?? ''}`.trim())
  }
  return parts.join('\n')
}

function defaultLlmModel(provider: 'gemini' | 'openrouter' | 'groq'): string {
  if (provider === 'openrouter') return 'openai/gpt-4o-mini'
  if (provider === 'groq') return 'llama-3.1-8b-instant'
  return 'gemini-2.0-flash'
}
