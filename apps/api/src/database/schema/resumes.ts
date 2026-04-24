import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const resumes = pgTable('resumes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  skills: text('skills').notNull(),
  experienceSummary: text('experience_summary').notNull(),
  experienceYears: integer('experience_years').notNull(),
  education: text('education'),
  desiredSalary: integer('desired_salary'),
  desiredSalaryCurrency: varchar('desired_salary_currency', { length: 16 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ResumeRecord = typeof resumes.$inferSelect
export type NewResumeRecord = typeof resumes.$inferInsert
