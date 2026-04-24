import { createZodDto } from 'nestjs-zod'
import { CreateBlacklistEntrySchema } from '@repo/shared'

export class CreateBlacklistEntryBodyDto extends createZodDto(CreateBlacklistEntrySchema) {}
