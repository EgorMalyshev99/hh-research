import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const vacancyImportRuns = pgTable('vacancy_import_runs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  limitRequested: integer('limit_requested').notNull(),
  imported: integer('imported').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  status: text('status').notNull().default('running'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})

export type VacancyImportRun = typeof vacancyImportRuns.$inferSelect
export type NewVacancyImportRun = typeof vacancyImportRuns.$inferInsert
