import { z } from 'zod'

import {
  BlacklistEntrySchema,
  LlmResumeAnalysisResponseSchema,
  ResumeSchema,
  StoredVacancyListSchema,
  StoredVacancyRowSchema,
  VacancyCreateSchema,
  VacancyImportRunHistoryListSchema,
  VacancyUpdateSchema,
} from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class StoredVacancyRowDto extends createZodDto(StoredVacancyRowSchema) {}
export class StoredVacancyListDto extends createZodDto(StoredVacancyListSchema) {}
export class VacancyCreateBodyDto extends createZodDto(VacancyCreateSchema) {}
export class VacancyUpdateBodyDto extends createZodDto(VacancyUpdateSchema) {}
export class ResumeDto extends createZodDto(ResumeSchema) {}
export class ResumeListDto extends createZodDto(z.array(ResumeSchema)) {}
export class BlacklistEntryDto extends createZodDto(BlacklistEntrySchema) {}
export class BlacklistEntryListDto extends createZodDto(z.array(BlacklistEntrySchema)) {}
export class VacancyImportRunHistoryListDto extends createZodDto(VacancyImportRunHistoryListSchema) {}
export class LlmResumeAnalysisResponseDto extends createZodDto(LlmResumeAnalysisResponseSchema) {}
export class OkResponseDto extends createZodDto(z.object({ ok: z.literal(true) })) {}
