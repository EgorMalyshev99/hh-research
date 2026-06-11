import { VacancyImportProviderListSchema, VacancyImportRunBodySchema, VacancyImportRunResultSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class VacancyImportRunBodyDto extends createZodDto(VacancyImportRunBodySchema) {}
export class VacancyImportRunResultDto extends createZodDto(VacancyImportRunResultSchema) {}
export class VacancyImportProviderListDto extends createZodDto(VacancyImportProviderListSchema) {}
