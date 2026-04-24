import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { LlmService } from './llm.service.js'

@ApiTags('llm')
@ApiBearerAuth('access-token')
@Controller('llm')
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Get('status')
  async status() {
    return this.llmService.getProvidersStatus()
  }
}
