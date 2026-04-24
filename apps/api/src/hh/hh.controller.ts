import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { VacancySchema } from '@repo/shared'
import { z } from 'zod'

import { HhService } from './hh.service.js'

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
}
