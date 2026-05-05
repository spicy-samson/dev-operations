/**
 * GET /api/dashboard/stats
 * Returns project/task/upload counts for the logged-in user.
 */
import { requireAuth }         from '~/server/utils/auth'
import { useDb }               from '~/server/db/client'
import { projects, tasks, uploads } from '~/server/db/schema'
import { eq, count, inArray }  from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const db      = useDb()

  // Count projects owned by user
  const [projectRow] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, session.userId))

  // Count tasks inside those projects
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, session.userId))

  const projectIds = userProjects.map(p => p.id)

  const [taskRow] = projectIds.length
    ? await db.select({ count: count() }).from(tasks).where(inArray(tasks.projectId, projectIds))
    : [{ count: 0 }]

  // Count uploads by user
  const [uploadRow] = await db
    .select({ count: count() })
    .from(uploads)
    .where(eq(uploads.userId, session.userId))

  return {
    projects: Number(projectRow?.count ?? 0),
    tasks:    Number(taskRow?.count    ?? 0),
    uploads:  Number(uploadRow?.count  ?? 0),
  }
})