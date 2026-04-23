import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import type { CoverLetterConfig, SearchConfig } from '@repo/shared'
import { users } from './users.js'

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  searchConfig: jsonb('search_config').$type<SearchConfig>(),
  coverLetterConfig: jsonb('cover_letter_config').$type<CoverLetterConfig>(),
  resumeMarkdown: text('resume_markdown'),
  llmProvider: text('llm_provider').notNull().default('gemini'),
  llmModel: text('llm_model').notNull().default('gemini-2.0-flash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
