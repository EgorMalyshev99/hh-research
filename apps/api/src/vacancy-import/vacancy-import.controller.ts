import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'

import {
  VacancyImportProviderListDto,
  VacancyImportRunBodyDto,
  VacancyImportRunResultDto,
} from './dto/vacancy-import.dto.js'
import { VacancyImportService } from './vacancy-import.service.js'

@ApiTags('admin-vacancy-import')
@ApiBearerAuth('access-token')
@Controller('admin/vacancy-import')
@Roles('admin')
export class VacancyImportController {
  constructor(private vacancyImportService: VacancyImportService) {}

  @Get('providers')
  @ApiOkResponse({ type: VacancyImportProviderListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  listProviders() {
    return this.vacancyImportService.listProviders()
  }

  @Post('run')
  @ApiBody({ type: VacancyImportRunBodyDto })
  @ApiOkResponse({ type: VacancyImportRunResultDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  run(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    return this.vacancyImportService.run(req.user.sub, body)
  }
}
