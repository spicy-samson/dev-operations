/**
 * PATCH /api/admin/users/:id/role
 * Promotes or demotes a user. Admin only.
 * Cannot demote yourself.
 */
import { z }             from 'zod'
import { eq }            from 'drizzle-orm'
import { requireAdmin }  from '~/server/utils/auth'
import { validateBody, validateParams, uuidParam } from '~/server/utils/validate'
import { useDb }         from '~/server/db/client'
import { users }         from '~/server/db/schema'

const bodySchema = z.object({
  role: z.enum(['user', 'admin']),
})

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const { id }  = validateParams(event, uuidParam)
  const { role } = await validateBody(event, bodySchema)

  if (id === session.userId) {
    throw createError({ statusCode: 400, message: 'You cannot change your own role' })
  }

  const db = useDb()
  const [targetUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (targetUser.role === 'admin' && role === 'user') {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(2)

    if (admins.length <= 1) {
      throw createError({
        statusCode: 400,
        message: 'Cannot demote the last remaining admin',
      })
    }
  }

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, role: users.role })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return { user: updated }
})