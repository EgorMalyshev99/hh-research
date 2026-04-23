import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const blacklist = pgTable('blacklist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BlacklistRow = typeof blacklist.$inferSelect
export type NewBlacklistRow = typeof blacklist.$inferInsert
