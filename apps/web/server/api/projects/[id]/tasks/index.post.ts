/**
 * POST /api/projects/:id/tasks
 * Creates a task inside a project. Ownership verified through project.
 */
import { z }                            from 'zod'
import { eq, count }                    from 'drizzle-orm'
import { requireAuth }                  from '~/server/utils/auth'
import { useDb }                        from '~/server/db/client'
import { tasks }                        from '~/server/db/schema'
import { validateBody, validateParams, projectIdSegmentParam } from '~/server/utils/validate'
import { requireProjectOwnership }      from '~/server/utils/ownership'

const bodySchema = z.object({
  title:       z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).default(''),
  status:      z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate:     z.string().datetime().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session              = await requireAuth(event)
  const { id: projectId }    = validateParams(event, projectIdSegmentParam)
  const body                 = await validateBody(event, bodySchema)

  // Verify project ownership
  await requireProjectOwnership(projectId, session.userId)

  const db = useDb()

  // Set position to end of list
  const [{ count: taskCount }] = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))

  const [task] = await db
    .insert(tasks)
    .values({
      projectId,
      title:       body.title.trim(),
      description: body.description.trim(),
      status:      body.status,
      priority:    body.priority,
      position:    Number(taskCount),
      dueDate:     body.dueDate ? new Date(body.dueDate) : null,
    })
    .returning()

  setResponseStatus(event, 201)
  return { task }
})