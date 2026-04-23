import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module.js'
import type { AppConfig } from './config/config.schema.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  app.use(cookieParser())

  app.setGlobalPrefix('api')

  const config = app.get(ConfigService<AppConfig, true>)
  const frontendUrl = config.getOrThrow('FRONTEND_URL')
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  const port = config.getOrThrow('PORT')
  await app.listen(port)
}

bootstrap()
