import { boolean, integer, pgTable, real, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { users } from './users.js'
import { vacancies } from './vacancies.js'

export const vacancyUserStates = pgTable(
  'vacancy_user_states',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vacancyId: integer('vacancy_id')
      .notNull()
      .references(() => vacancies.id, { onDelete: 'cascade' }),
    isViewed: boolean('is_viewed').notNull().default(false),
    isApplied: boolean('is_applied').notNull().default(false),
    hidden: boolean('hidden').notNull().default(false),
    score: real('score'),
    scoreReason: text('score_reason'),
    coverLetter: text('cover_letter'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userVacancyUnique: uniqueIndex('vacancy_user_states_user_vacancy_unique').on(t.userId, t.vacancyId),
  })
)

export type VacancyUserStateRecord = typeof vacancyUserStates.$inferSelect
export type NewVacancyUserStateRecord = typeof vacancyUserStates.$inferInsert
