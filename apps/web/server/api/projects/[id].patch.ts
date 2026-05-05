/**
 * PATCH /api/projects/:id
 * Partially updates a project. Ownership enforced.
 */
import { z }                         from 'zod'
import { eq }                        from 'drizzle-orm'
import { requireAuth }               from '~/server/utils/auth'
import { useDb }                     from '~/server/db/client'
import { projects }                  from '~/server/db/schema'
import { validateBody, validateParams, uuidParam } from '~/server/utils/validate'
import { requireProjectOwnership }   from '~/server/utils/ownership'

const bodySchema = z.object({
  name:     z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status:      z.enum(['active', 'archived', 'completed']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field is required',
})

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id }  = validateParams(event, uuidParam)
  const body    = await validateBody(event, bodySchema)

  // Verify ownership before touching anything
  await requireProjectOwnership(id, session.userId)

  const db = useDb()

  const [updated] = await db
    .update(projects)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning()

  return { project: updated }
})