import type { VacancyData, VacancySource } from '@repo/shared'
import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const vacancySourceEnum = pgEnum('vacancy_source', ['manual', 'trudvsem', 'superjob'])

export const vacancies = pgTable(
  'vacancies',
  {
    id: serial('id').primaryKey(),
    source: vacancySourceEnum('source').notNull(),
    externalId: text('external_id'),
    ownerUserId: integer('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
    data: jsonb('data').$type<VacancyData>().notNull(),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceExternalUnique: uniqueIndex('vacancies_source_external_unique').on(t.source, t.externalId),
  })
)

export type VacancyRecord = typeof vacancies.$inferSelect
export type NewVacancyRecord = typeof vacancies.$inferInsert
export type VacancySourceDb = VacancySource
