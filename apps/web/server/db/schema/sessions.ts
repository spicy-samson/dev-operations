/**
 * server/db/schema/sessions.ts
 *
 * sessions — persisted server-side sessions.
 * nuxt-auth-utils handles the cookie; this table lets us
 * invalidate sessions server-side (logout everywhere, ban user, etc.)
 *
 * The cookie stores only the session `id`. The server looks up the
 * full session row to get userId and metadata.
 */
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Optional: store IP + UA for security audit
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  // Arbitrary session data (e.g. last seen page, preferences)
  data:      jsonb('data').default({}),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Session    = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert