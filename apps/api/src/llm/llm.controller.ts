import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'

import { LlmProvidersStatusDto } from './dto/llm.dto.js'
import { LlmService } from './llm.service.js'

@ApiTags('llm')
@ApiBearerAuth('access-token')
@Controller('llm')
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Get('status')
  @Roles('admin')
  @ApiOkResponse({ type: LlmProvidersStatusDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async status() {
    return this.llmService.getProvidersStatus()
  }
}
