import { Body, Controller, Post, Req, Sse } from '@nestjs/common'
import type { MessageEvent } from '@nestjs/common'
import type { Request } from 'express'
import { Observable } from 'rxjs'
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { SearchService } from './search.service.js'

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post('run')
  async run(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const payload = await this.searchService.validateBeforeRun(req.user.sub, body)
    void this.searchService.executeRun(req.user.sub, payload)
    return { started: true, llm: payload.llm }
  }

  /** EventSource в браузере не шлёт Authorization — передавайте `?access_token=` */
  @Sse('stream')
  stream(@Req() req: Request & { user: JwtPayload }): Observable<MessageEvent> {
    return this.searchService.watch(req.user.sub)
  }
}
