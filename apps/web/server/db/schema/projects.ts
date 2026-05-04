/**
 * server/db/schema/projects.ts
 *
 * projects — top-level containers owned by a user.
 * Each user sees only their own projects (ownership enforced in API routes).
 */
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'archived',
  'completed',
])

export const projects = pgTable('projects', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description').notNull().default(''),
  status:      projectStatusEnum('status').notNull().default('active'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

export type Project    = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectStatus = Project['status']