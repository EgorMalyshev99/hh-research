import { Controller, Delete, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { VacancySourceSchema } from '@repo/shared'

import { Roles } from '../common/decorators/roles.decorator.js'
import { mapVacancyRow, VacanciesService } from '../vacancies/vacancies.service.js'

@ApiTags('admin-vacancies')
@ApiBearerAuth('access-token')
@Controller('admin/vacancies')
@Roles('admin')
export class AdminVacanciesController {
  constructor(private vacanciesService: VacanciesService) {}

  @Get()
  async list(@Query('source') source?: string) {
    const parsedSource = source ? VacancySourceSchema.safeParse(source) : null
    const rows = await this.vacanciesService.listAdmin(parsedSource?.success ? parsedSource.data : undefined)
    return rows.map((r) => mapVacancyRow(r, null))
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vacanciesService.deleteAdmin(id)
    return { ok: true }
  }
}
