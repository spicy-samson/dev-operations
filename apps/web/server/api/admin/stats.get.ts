/**
 * GET /api/admin/stats
 * Site-wide aggregate stats. Admin only.
 */
import { requireAdmin }  from '~/server/utils/auth'
import { useDb }         from '~/server/db/client'
import { users, projects, tasks, uploads } from '~/server/db/schema'
import { count, eq }     from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const [[userRow], [projectRow], [taskRow], [uploadRow]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(projects),
    db.select({ count: count() }).from(tasks),
    db.select({ count: count() }).from(uploads).where(eq(uploads.status, 'uploaded')),
  ])

  return {
    users:    Number(userRow?.count    ?? 0),
    projects: Number(projectRow?.count ?? 0),
    tasks:    Number(taskRow?.count    ?? 0),
    uploads:  Number(uploadRow?.count  ?? 0),
  }
})