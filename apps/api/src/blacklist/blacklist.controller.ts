import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger'
import { CreateBlacklistEntrySchema } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'

import { CreateBlacklistEntryBodyDto } from './dto/blacklist.dto.js'
import { BlacklistService } from './blacklist.service.js'

@ApiTags('blacklist')
@ApiBearerAuth('access-token')
@Controller('blacklist')
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  @Get()
  async list(@Req() req: Request & { user: JwtPayload }) {
    const rows = await this.blacklistService.list(req.user.sub)
    return rows.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  @Post()
  @ApiBody({ type: CreateBlacklistEntryBodyDto })
  async add(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = CreateBlacklistEntrySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const row = await this.blacklistService.add(req.user.sub, parsed.data)
    return {
      id: row.id,
      companyName: row.companyName,
      createdAt: row.createdAt.toISOString(),
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.blacklistService.remove(req.user.sub, id)
    return { ok: true }
  }
}
