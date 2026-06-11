import { type INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'

export function buildSwaggerDocument(app: INestApplication, options?: { version?: '3.0' | '3.1' }) {
  const config = new DocumentBuilder()
    .setTitle('job-research API')
    .setDescription('REST API локального ассистента поиска работы')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  return cleanupOpenApiDoc(document, { version: options?.version ?? '3.1' })
}
