import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { VacancySchema } from '@repo/shared'
import { z } from 'zod'

import { HhService } from './hh.service.js'

const BuildAuthorizeUrlBodySchema = z.object({
  state: z.string().min(1).optional(),
  forceLogin: z.boolean().optional(),
  skipChooseAccount: z.boolean().optional(),
  role: z.enum(['applicant', 'employer']).optional(),
  forceRole: z.boolean().optional(),
})

const ExchangeCodeBodySchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
})

const RefreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1),
})

@ApiTags('hh')
@ApiBearerAuth('access-token')
@Controller('hh')
export class HhController {
  constructor(private readonly hhService: HhService) {}

  @Post('vacancies/search')
  async searchVacancies(@Body() body: unknown) {
    const list = await this.hhService.searchVacancies(body)
    return z.array(VacancySchema).parse(list)
  }

  @Get('areas')
  async areas() {
    return this.hhService.fetchAreas()
  }

  @Post('oauth/authorize-url')
  async oauthAuthorizeUrl(@Body() body: unknown) {
    const dto = BuildAuthorizeUrlBodySchema.parse(body ?? {})
    return this.hhService.buildOauthAuthorizeUrl(dto)
  }

  @Post('oauth/token')
  async oauthToken(@Body() body: unknown) {
    const dto = ExchangeCodeBodySchema.parse(body)
    return this.hhService.exchangeCodeForToken(dto.code, dto.codeVerifier)
  }

  @Post('oauth/refresh')
  async oauthRefresh(@Body() body: unknown) {
    const dto = RefreshTokenBodySchema.parse(body)
    return this.hhService.refreshOauthToken(dto.refreshToken)
  }

  @Get('oauth/callback')
  oauthCallback(@Query('code') code?: string, @Query('state') state?: string, @Query('error') error?: string) {
    return { code, state, error }
  }
}
