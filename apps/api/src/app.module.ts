import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { validateConfig } from './config/config.schema.js'
import { DatabaseModule } from './database/database.module.js'
import { AuthModule } from './auth/auth.module.js'
import { UsersModule } from './users/users.module.js'
import { VacanciesModule } from './vacancies/vacancies.module.js'
import { HhModule } from './hh/hh.module.js'
import { LlmModule } from './llm/llm.module.js'
import { SearchModule } from './search/search.module.js'
import { SettingsModule } from './settings/settings.module.js'
import { BlacklistModule } from './blacklist/blacklist.module.js'
import { HistoryModule } from './history/history.module.js'

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
    AuthModule,
    UsersModule,
    VacanciesModule,
    HhModule,
    LlmModule,
    SearchModule,
    SettingsModule,
    BlacklistModule,
    HistoryModule,
  ],
})
export class AppModule {}
