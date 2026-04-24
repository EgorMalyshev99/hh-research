import { Module } from '@nestjs/common'

import { BlacklistModule } from '../blacklist/blacklist.module.js'
import { LlmModule } from '../llm/llm.module.js'
import { ResumesModule } from '../resumes/resumes.module.js'
import { TelegramModule } from '../telegram/telegram.module.js'
import { UsersModule } from '../users/users.module.js'
import { VacanciesModule } from '../vacancies/vacancies.module.js'

import { SearchController } from './search.controller.js'
import { SearchService } from './search.service.js'

@Module({
  imports: [LlmModule, VacanciesModule, BlacklistModule, ResumesModule, UsersModule, TelegramModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
