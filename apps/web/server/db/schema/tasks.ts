/**
 * server/db/schema/tasks.ts
 *
 * tasks — belong to a project, which belongs to a user.
 * Ownership is always checked via the project's userId (not stored here).
 */
import {
    pgTable, uuid, text, timestamp, pgEnum, integer,
  } from 'drizzle-orm/pg-core'
  import { projects } from './projects'
  
  export const taskStatusEnum   = pgEnum('task_status',   ['todo', 'in_progress', 'done'])
  export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high'])
  
  export const tasks = pgTable('tasks', {
    id:          uuid('id').primaryKey().defaultRandom(),
    projectId:   uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title:       text('title').notNull(),
    description: text('description').notNull().default(''),
    status:      taskStatusEnum('status').notNull().default('todo'),
    priority:    taskPriorityEnum('priority').notNull().default('medium'),
    // Simple ordering within a project — lower = higher up the list
    position:    integer('position').notNull().default(0),
    dueDate:     timestamp('due_date'),
    createdAt:   timestamp('created_at').notNull().defaultNow(),
    updatedAt:   timestamp('updated_at').notNull().defaultNow(),
  })
  
  export type Task         = typeof tasks.$inferSelect
  export type NewTask      = typeof tasks.$inferInsert
  export type TaskStatus   = Task['status']
  export type TaskPriority = Task['priority']