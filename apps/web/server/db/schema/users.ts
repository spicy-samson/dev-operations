/**
 * server/db/schema/users.ts
 *
 * users — one row per registered account.
 * Password is stored as an argon2 hash, never plaintext.
 * role: 'user' | 'admin' — drives the admin panel guard.
 */
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('user_role', ['user', 'admin'])

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  password:  text('password').notNull(),       // argon2 hash
  name:      text('name').notNull().default(''),
  role:      roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User       = typeof users.$inferSelect
export type NewUser    = typeof users.$inferInsert
export type UserRole   = User['role']
// Safe type — never expose password to the client
export type PublicUser = Omit<User, 'password'>