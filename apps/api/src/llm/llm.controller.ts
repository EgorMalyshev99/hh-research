import { Controller, Get } from '@nestjs/common'
import { LlmService } from './llm.service.js'

@Controller('llm')
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Get('status')
  async status() {
    return this.llmService.getProvidersStatus()
  }
}
