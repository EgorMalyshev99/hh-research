import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    const requestId = req.requestId

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()
      const body =
        typeof payload === 'string'
          ? { statusCode: status, message: payload, requestId }
          : { ...(payload as Record<string, unknown>), statusCode: status, requestId }
      res.status(status).json(body)
      return
    }

    const err = exception instanceof Error ? exception : new Error(String(exception))
    this.logger.error(err.stack ?? err.message)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
      requestId,
    })
  }
}
