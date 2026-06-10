import { CreateBlacklistEntrySchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class CreateBlacklistEntryBodyDto extends createZodDto(CreateBlacklistEntrySchema) {}
