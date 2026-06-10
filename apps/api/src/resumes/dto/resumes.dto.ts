import { ResumeInputSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class ResumeInputDto extends createZodDto(ResumeInputSchema) {}
