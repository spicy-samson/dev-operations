/**
 * GET /api/projects/:id
 * Returns a single project + its tasks. Ownership enforced.
 */
import { eq, asc }                      from 'drizzle-orm'
import { requireAuth }                  from '~/server/utils/auth'
import { useDb }                        from '~/server/db/client'
import { tasks }                        from '~/server/db/schema'
import { validateParams, uuidParam }    from '~/server/utils/validate'
import { requireProjectOwnership }      from '~/server/utils/ownership'

export default defineEventHandler(async (event) => {
  const session   = await requireAuth(event)
  const { id }    = validateParams(event, uuidParam)
  const project   = await requireProjectOwnership(id, session.userId)
  const db        = useDb()

  // Fetch tasks for this project ordered by position
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, id))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))

  return { project, tasks: projectTasks }
})