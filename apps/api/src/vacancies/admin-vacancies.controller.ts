import { Controller, Delete, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { VacancySourceSchema } from '@repo/shared'

import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import { OkResponseDto, StoredVacancyListDto } from '../common/dto/domain.dto.js'
import { mapVacancyRow, VacanciesService } from '../vacancies/vacancies.service.js'

@ApiTags('admin-vacancies')
@ApiBearerAuth('access-token')
@Controller('admin/vacancies')
@Roles('admin')
export class AdminVacanciesController {
  constructor(private vacanciesService: VacanciesService) {}

  @Get()
  @ApiOkResponse({ type: StoredVacancyListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async list(@Query('source') source?: string) {
    const parsedSource = source ? VacancySourceSchema.safeParse(source) : null
    const rows = await this.vacanciesService.listAdmin(parsedSource?.success ? parsedSource.data : undefined)
    return rows.map((r) => mapVacancyRow(r, null))
  }

  @Delete(':id')
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.deleteAdmin(id)
    return { ok: true }
  }
}
