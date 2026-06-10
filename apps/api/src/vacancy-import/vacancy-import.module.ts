import { Module } from '@nestjs/common'

import { VacanciesModule } from '../vacancies/vacancies.module.js'

import { SuperjobProvider } from './providers/superjob.provider.js'
import { TrudvsemProvider } from './providers/trudvsem.provider.js'
import { VacancyImportController } from './vacancy-import.controller.js'
import { VacancyImportService } from './vacancy-import.service.js'

@Module({
  imports: [VacanciesModule],
  controllers: [VacancyImportController],
  providers: [VacancyImportService, TrudvsemProvider, SuperjobProvider],
})
export class VacancyImportModule {}
