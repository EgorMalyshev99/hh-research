import { createZodDto } from 'nestjs-zod'
import { UpdateSettingsSchema } from '@repo/shared'

export class UpdateSettingsBodyDto extends createZodDto(UpdateSettingsSchema) {}
