import { BadRequestException, Body, Controller, Get, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger'
import { UpdateSettingsSchema } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'

import { UpdateSettingsBodyDto } from './dto/settings.dto.js'
import { SettingsService } from './settings.service.js'

@ApiTags('settings')
@ApiBearerAuth('access-token')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async get(@Req() req: Request & { user: JwtPayload }) {
    return this.toApi(await this.settingsService.getOrCreate(req.user.sub))
  }

  @Put()
  @ApiBody({ type: UpdateSettingsBodyDto })
  async put(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = UpdateSettingsSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    return this.toApi(await this.settingsService.update(req.user.sub, parsed.data))
  }

  @Get('resume')
  async getResume(@Req() req: Request & { user: JwtPayload }) {
    const s = await this.settingsService.getOrCreate(req.user.sub)
    return { resumeMarkdown: s.resumeMarkdown ?? '' }
  }

  @Put('resume')
  async putResume(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const b = body as { resumeMarkdown?: string }
    if (typeof b.resumeMarkdown !== 'string') {
      throw new BadRequestException('Ожидается { resumeMarkdown: string }')
    }
    return this.toApi(await this.settingsService.update(req.user.sub, { resumeMarkdown: b.resumeMarkdown }))
  }

  private toApi(s: Awaited<ReturnType<SettingsService['getOrCreate']>>) {
    return {
      id: s.id,
      userId: s.userId,
      searchConfig: s.searchConfig,
      coverLetterConfig: s.coverLetterConfig ?? undefined,
      resumeMarkdown: s.resumeMarkdown,
      llmProvider: s.llmProvider,
      llmModel: s.llmModel,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }
  }
}
