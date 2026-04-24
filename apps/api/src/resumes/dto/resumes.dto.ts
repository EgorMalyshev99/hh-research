import { createZodDto } from 'nestjs-zod'
import { ResumeInputSchema } from '@repo/shared'

export class ResumeInputDto extends createZodDto(ResumeInputSchema) {}
