import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module.js'
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js'
import type { AppConfig } from './config/config.schema.js'
import { resolveCorsOrigins } from './config/cors-origins.js'
import { buildSwaggerDocument } from './openapi/swagger-document.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.use(requestIdMiddleware)
  app.useLogger(app.get(Logger))

  app.use(cookieParser())

  app.setGlobalPrefix('api')

  const config = app.get(ConfigService<AppConfig, true>)
  const corsOrigins = resolveCorsOrigins(
    config.getOrThrow('DASHBOARD_URL'),
    config.getOrThrow('LANDING_URL'),
    config.get('CORS_ORIGINS')
  )
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })

  const swaggerDocument = buildSwaggerDocument(app)
  SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: false })

  const port = config.getOrThrow('PORT')
  await app.listen(port)
}

void bootstrap()
