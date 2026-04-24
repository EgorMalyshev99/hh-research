import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'

import { AuthModule } from './auth/auth.module.js'
import { BlacklistModule } from './blacklist/blacklist.module.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { validateConfig } from './config/config.schema.js'
import { DatabaseModule } from './database/database.module.js'
import { HhModule } from './hh/hh.module.js'
import { HistoryModule } from './history/history.module.js'
import { LlmModule } from './llm/llm.module.js'
import { ResumesModule } from './resumes/resumes.module.js'
import { SearchModule } from './search/search.module.js'
import { TelegramModule } from './telegram/telegram.module.js'
import { UsersModule } from './users/users.module.js'
import { VacanciesModule } from './vacancies/vacancies.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateConfig,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),
    DatabaseModule,
    HhModule,
    AuthModule,
    UsersModule,
    VacanciesModule,
    ResumesModule,
    LlmModule,
    TelegramModule,
    SearchModule,
    BlacklistModule,
    HistoryModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
