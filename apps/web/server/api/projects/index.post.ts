/**
 * POST /api/projects
 * Creates a new project owned by the logged-in user.
 */
import { z }                         from 'zod'
import { requireAuth }               from '~/server/utils/auth'
import { useDb }                     from '~/server/db/client'
import { projects }                  from '~/server/db/schema'
import { validateBody }              from '~/server/utils/validate'

const bodySchema = z.object({
  name:        z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).default(''),
  status:      z.enum(['active', 'archived', 'completed']).default('active'),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body    = await validateBody(event, bodySchema)
  const db      = useDb()

  const [project] = await db
    .insert(projects)
    .values({
      userId:      session.userId,
      name:        body.name.trim(),
      description: body.description.trim(),
      status:      body.status,
    })
    .returning()

  setResponseStatus(event, 201)
  return { project }
})