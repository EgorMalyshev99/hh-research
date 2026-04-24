import { Body, Controller, ForbiddenException, Get, Post, Req, Sse, type MessageEvent } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { Observable } from 'rxjs'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'

import { RunSearchBodyDto } from './dto/search.dto.js'
import { SearchService } from './search.service.js'

@ApiTags('search')
@ApiBearerAuth('access-token')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post('run')
  @ApiBody({ type: RunSearchBodyDto })
  async run(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Только admin может запускать анализ')
    }
    const payload = await this.searchService.validateBeforeRun(req.user.sub, body)
    void this.searchService.executeRun(req.user.sub, payload)
    return { started: true, llm: payload.llm }
  }

  /** EventSource в браузере не шлёт Authorization — передавайте `?access_token=` */
  @Sse('stream')
  stream(@Req() req: Request & { user: JwtPayload }): Observable<MessageEvent> {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Только admin может получать поток прогресса анализа')
    }
    return this.searchService.watch(req.user.sub)
  }

  @Get('status')
  status(@Req() req: Request & { user: JwtPayload }) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Только admin может проверять статус анализа')
    }
    return { running: this.searchService.isRunningForUser(req.user.sub) }
  }
}
