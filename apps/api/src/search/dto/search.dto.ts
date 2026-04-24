import { createZodDto } from 'nestjs-zod'
import { RunSearchBodySchema } from '@repo/shared'

export class RunSearchBodyDto extends createZodDto(RunSearchBodySchema) {}
