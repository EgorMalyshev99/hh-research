import { Module } from '@nestjs/common'
import { BlacklistModule } from '../blacklist/blacklist.module.js'
import { HhModule } from '../hh/hh.module.js'
import { LlmModule } from '../llm/llm.module.js'
import { SettingsModule } from '../settings/settings.module.js'
import { VacanciesModule } from '../vacancies/vacancies.module.js'
import { SearchController } from './search.controller.js'
import { SearchService } from './search.service.js'

@Module({
  imports: [HhModule, LlmModule, SettingsModule, VacanciesModule, BlacklistModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
