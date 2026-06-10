import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'

import { VacancyImportService } from './vacancy-import.service.js'

@ApiTags('admin-vacancy-import')
@ApiBearerAuth('access-token')
@Controller('admin/vacancy-import')
@Roles('admin')
export class VacancyImportController {
  constructor(private vacancyImportService: VacancyImportService) {}

  @Get('providers')
  listProviders() {
    return this.vacancyImportService.listProviders()
  }

  @Post('run')
  run(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    return this.vacancyImportService.run(req.user.sub, body)
  }
}
