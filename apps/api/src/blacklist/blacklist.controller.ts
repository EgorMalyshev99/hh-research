import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CreateBlacklistEntrySchema } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import { BlacklistEntryDto, BlacklistEntryListDto, OkResponseDto } from '../common/dto/domain.dto.js'

import { BlacklistService } from './blacklist.service.js'
import { CreateBlacklistEntryBodyDto } from './dto/blacklist.dto.js'

@ApiTags('blacklist')
@ApiBearerAuth('access-token')
@Roles('job_seeker', 'admin')
@Controller('blacklist')
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  @Get()
  @ApiOkResponse({ type: BlacklistEntryListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
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
  @ApiOkResponse({ type: BlacklistEntryDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
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
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async remove(@Req() req: Request & { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    await this.blacklistService.remove(req.user.sub, id)
    return { ok: true }
  }
}
