import type { Vacancy } from '@repo/shared'
import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const vacancies = pgTable(
  'vacancies',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hhId: text('hh_id').notNull(),
    data: jsonb('data').$type<Vacancy>().notNull(),
    score: real('score'),
    scoreReason: text('score_reason'),
    isRelevant: boolean('is_relevant'),
    coverLetter: text('cover_letter'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    isViewed: boolean('is_viewed').notNull().default(false),
    isApplied: boolean('is_applied').notNull().default(false),
    hidden: boolean('hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userHhUnique: uniqueIndex('vacancies_user_hh_unique').on(t.userId, t.hhId),
  }),
)

export type VacancyRecord = typeof vacancies.$inferSelect
export type NewVacancyRecord = typeof vacancies.$inferInsert
