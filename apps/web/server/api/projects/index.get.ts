/**
 * GET /api/projects
 * Returns all projects owned by the logged-in user, newest first.
 */
import { eq, desc }                  from 'drizzle-orm'
import { requireAuth }               from '~/server/utils/auth'
import { useDb }                     from '~/server/db/client'
import { projects }                  from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const db      = useDb()

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.userId))
    .orderBy(desc(projects.createdAt))

  return { projects: rows }
})