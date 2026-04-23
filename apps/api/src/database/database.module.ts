import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'
import type { AppConfig } from '../config/config.schema.js'

export const DRIZZLE = Symbol('DRIZZLE')

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory(configService: ConfigService<AppConfig, true>): DrizzleDb {
        const url = configService.getOrThrow('DATABASE_URL')
        const client = postgres(url, { max: 10 })
        return drizzle(client, { schema })
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
