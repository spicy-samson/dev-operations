/**
 * GET /api/admin/users
 * Returns all users with stats. Admin only.
 */
import { requireAdmin }   from '~/server/utils/auth'
import { useDb }          from '~/server/db/client'
import { users, projects, uploads } from '~/server/db/schema'
import { eq, count, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const allUsers = await db
    .select({
      id:        users.id,
      email:     users.email,
      name:      users.name,
      role:      users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  // Get project + upload counts per user in two queries (simple, free-tier friendly)
  const projectCounts = await db
    .select({ userId: projects.userId, count: count() })
    .from(projects)
    .groupBy(projects.userId)

  const uploadCounts = await db
    .select({ userId: uploads.userId, count: count() })
    .from(uploads)
    .where(eq(uploads.status, 'uploaded'))
    .groupBy(uploads.userId)

  const projectMap = Object.fromEntries(projectCounts.map(r => [r.userId, Number(r.count)]))
  const uploadMap  = Object.fromEntries(uploadCounts.map(r => [r.userId, Number(r.count)]))

  const result = allUsers.map(u => ({
    ...u,
    projectCount: projectMap[u.id] ?? 0,
    uploadCount:  uploadMap[u.id]  ?? 0,
  }))

  return { users: result, total: result.length }
})