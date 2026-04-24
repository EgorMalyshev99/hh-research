import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'

import { TelegramService } from '../../telegram/telegram.service.js'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor(private readonly telegramService: TelegramService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    const requestId = req.requestId

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()
      const message = typeof payload === 'string' ? payload : extractMessage(payload)
      const body =
        typeof payload === 'string'
          ? { statusCode: status, message: payload, requestId }
          : { ...(payload as Record<string, unknown>), statusCode: status, requestId }
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        void this.telegramService.notifyErrorToGroup({
          statusCode: status,
          path: req.originalUrl,
          method: req.method,
          requestId,
          message,
        })
      }
      res.status(status).json(body)
      return
    }

    const err = exception instanceof Error ? exception : new Error(String(exception))
    this.logger.error(err.stack ?? err.message)
    void this.telegramService.notifyErrorToGroup({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: req.originalUrl,
      method: req.method,
      requestId,
      message: err.message,
    })
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
      requestId,
    })
  }
}

function extractMessage(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message
    if (Array.isArray(message)) return message.join('; ')
    if (typeof message === 'string') return message
  }
  return 'HttpException'
}
