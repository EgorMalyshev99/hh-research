import fs from 'node:fs/promises'
import path from 'node:path'

import { NestFactory } from '@nestjs/core'

import { AppModule } from '../app.module.js'

import { buildSwaggerDocument } from './swagger-document.js'

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false })
  app.setGlobalPrefix('api')

  const document = buildSwaggerDocument(app, { version: '3.1' })
  const outDir = path.resolve(process.cwd(), 'openapi')
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'openapi.json'), JSON.stringify(document, null, 2))

  await app.close()
  console.log('OpenAPI spec written to openapi/openapi.json')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
