import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../database/schema/index.js'

type NodeEnv = 'development' | 'production' | 'test'

interface CreateDbOptions {
  databaseUrl: string
  nodeEnv: NodeEnv
}

export type DrizzleDb = ReturnType<typeof drizzlePg<typeof schema>>

export function createDb({ databaseUrl, nodeEnv }: CreateDbOptions): DrizzleDb {
  if (nodeEnv === 'production') {
    const sql = neon(databaseUrl)
    return drizzleNeon(sql, { schema }) as unknown as DrizzleDb
  }

  const sql = postgres(databaseUrl, { max: 10 })
  return drizzlePg(sql, { schema })
}
