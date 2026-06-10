import { Module } from '@nestjs/common'

import { BlacklistModule } from '../blacklist/blacklist.module.js'
import { LlmModule } from '../llm/llm.module.js'

import { AdminVacanciesController } from './admin-vacancies.controller.js'
import { MyVacanciesController, VacanciesController } from './vacancies.controller.js'
import { VacanciesService } from './vacancies.service.js'

@Module({
  imports: [LlmModule, BlacklistModule],
  controllers: [VacanciesController, MyVacanciesController, AdminVacanciesController],
  providers: [VacanciesService],
  exports: [VacanciesService],
})
export class VacanciesModule {}
