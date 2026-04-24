import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const searchRuns = pgTable('search_runs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull().default('running'),
  totalFound: integer('total_found'),
  aboveThreshold: integer('above_threshold'),
  errorMessage: text('error_message'),
})

export type SearchRun = typeof searchRuns.$inferSelect
export type NewSearchRun = typeof searchRuns.$inferInsert
