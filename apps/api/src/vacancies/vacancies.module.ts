import { Module } from '@nestjs/common'

import { LlmModule } from '../llm/llm.module.js'
import { ResumesModule } from '../resumes/resumes.module.js'

import { VacanciesController } from './vacancies.controller.js'
import { VacanciesService } from './vacancies.service.js'

@Module({
  imports: [ResumesModule, LlmModule],
  controllers: [VacanciesController],
  providers: [VacanciesService],
  exports: [VacanciesService],
})
export class VacanciesModule {}
