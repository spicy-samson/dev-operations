/**
 * DELETE /api/projects/:id/tasks/:taskId
 * Deletes a task. Ownership verified through project chain.
 */
import { z }                    from 'zod'
import { eq }                   from 'drizzle-orm'
import { requireAuth }          from '~/server/utils/auth'
import { useDb }                from '~/server/db/client'
import { tasks }                from '~/server/db/schema'
import { validateParams }       from '~/server/utils/validate'
import { requireTaskOwnership } from '~/server/utils/ownership'

const paramsSchema = z.object({
  id:     z.string().uuid(),
  taskId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const session    = await requireAuth(event)
  const { taskId } = validateParams(event, paramsSchema)

  await requireTaskOwnership(taskId, session.userId)

  const db = useDb()
  await db.delete(tasks).where(eq(tasks.id, taskId))

  setResponseStatus(event, 204)
  return null
})