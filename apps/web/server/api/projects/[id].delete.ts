/**
 * DELETE /api/projects/:id
 * Deletes a project and all its tasks (cascade is set in the DB schema).
 * Ownership enforced.
 */
import { eq }                        from 'drizzle-orm'
import { requireAuth }               from '~/server/utils/auth'
import { useDb }                     from '~/server/db/client'
import { projects }                  from '~/server/db/schema'
import { validateParams, uuidParam } from '~/server/utils/validate'
import { requireProjectOwnership }   from '~/server/utils/ownership'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id }  = validateParams(event, uuidParam)

  await requireProjectOwnership(id, session.userId)

  const db = useDb()
  await db.delete(projects).where(eq(projects.id, id))

  setResponseStatus(event, 204)
  return null
})