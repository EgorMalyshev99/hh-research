import { ApiErrorSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class ApiErrorDto extends createZodDto(ApiErrorSchema) {}
