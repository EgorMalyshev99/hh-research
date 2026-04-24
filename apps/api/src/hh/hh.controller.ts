import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { HhService } from './hh.service.js'

@ApiTags('hh')
@ApiBearerAuth('access-token')
@Controller('hh')
export class HhController {
  constructor(private readonly hhService: HhService) {}

  @Get('areas')
  async getAreas() {
    return this.hhService.getAreas()
  }
}
