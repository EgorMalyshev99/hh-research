import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppConfig } from '../config/config.schema.js'
import { createDb, type DrizzleDb as SharedDrizzleDb } from '../db/index.js'

export const DRIZZLE = Symbol('DRIZZLE')
export type DrizzleDb = SharedDrizzleDb

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory(configService: ConfigService<AppConfig, true>): DrizzleDb {
        return createDb({
          databaseUrl: configService.getOrThrow('DATABASE_URL'),
          nodeEnv: configService.getOrThrow('NODE_ENV'),
        })
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
