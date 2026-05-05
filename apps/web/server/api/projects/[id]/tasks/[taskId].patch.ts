/**
 * PATCH /api/projects/:id/tasks/:taskId
 * Partially updates a task. Ownership verified through project chain.
 */
import { z }                   from 'zod'
import { eq }                  from 'drizzle-orm'
import { requireAuth }         from '~/server/utils/auth'
import { useDb }               from '~/server/db/client'
import { tasks }               from '~/server/db/schema'
import { validateBody, validateParams } from '~/server/utils/validate'
import { requireTaskOwnership } from '~/server/utils/ownership'

const paramsSchema = z.object({
  id:     z.string().uuid(),
  taskId: z.string().uuid(),
})

const bodySchema = z.object({
  title:       z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status:      z.enum(['todo', 'in_progress', 'done']).optional(),
  priority:    z.enum(['low', 'medium', 'high']).optional(),
  position:    z.number().int().min(0).optional(),
  dueDate:     z.string().datetime().nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field is required',
})

export default defineEventHandler(async (event) => {
  const session             = await requireAuth(event)
  const { taskId }          = validateParams(event, paramsSchema)
  const body                = await validateBody(event, bodySchema)

  // Verify ownership through project chain
  await requireTaskOwnership(taskId, session.userId)

  const db = useDb()

  const [updated] = await db
    .update(tasks)
    .set({
      ...body,
      dueDate:   body.dueDate !== undefined
        ? (body.dueDate ? new Date(body.dueDate) : null)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning()

  return { task: updated }
})