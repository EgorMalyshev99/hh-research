import { LlmProvidersStatusSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class LlmProvidersStatusDto extends createZodDto(LlmProvidersStatusSchema) {}
