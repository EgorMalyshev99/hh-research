import { BadRequestException, Body, Controller, Get, Put, Req } from '@nestjs/common'
import type { Request } from 'express'
import { UpdateSettingsSchema } from '@repo/shared'
import { SettingsService } from './settings.service.js'
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async get(@Req() req: Request & { user: JwtPayload }) {
    return this.toApi(await this.settingsService.getOrCreate(req.user.sub))
  }

  @Put()
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
    return this.toApi(
      await this.settingsService.update(req.user.sub, { resumeMarkdown: b.resumeMarkdown }),
    )
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
