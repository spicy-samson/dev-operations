/**
 * server/db/schema/uploads.ts
 *
 * uploads — metadata for files stored in S3.
 * The actual bytes live in S3. This table tracks who uploaded what,
 * which project it belongs to, and the S3 key to build download URLs.
 */
import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users }    from './users'
import { projects } from './projects'

export const uploadStatusEnum = pgEnum('upload_status', [
  'pending',    // presigned URL issued, upload not confirmed yet
  'uploaded',   // client confirmed upload to S3
  'failed',     // client reported failure
])

export const uploads = pgTable('uploads', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id,    { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id,        { onDelete: 'set null' }),
  // S3 object key — e.g. uploads/user-uuid/filename-uuid.pdf
  s3Key:     text('s3_key').notNull().unique(),
  // Original filename shown in the UI
  fileName:  text('file_name').notNull(),
  mimeType:  text('mime_type').notNull().default('application/octet-stream'),
  // File size in bytes (reported by client, informational only)
  size:      integer('size').notNull().default(0),
  status:    uploadStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Upload    = typeof uploads.$inferSelect
export type NewUpload = typeof uploads.$inferInsert
export type UploadStatus = Upload['status']