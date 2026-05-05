/**
 * POST /api/auth/signup
 *
 * Creates a new user account and immediately logs them in.
 * Returns the public user object (no password field).
 */
import { z }               from 'zod'
import { eq }              from 'drizzle-orm'
import { useDb }           from '~/server/db/client'
import { users }           from '~/server/db/schema'
import { hashPassword }    from '~/server/utils/auth'
import type { AppSession } from '~/server/utils/auth'

const bodySchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name:     z.string().min(1, 'Name is required').max(100),
})

export default defineEventHandler(async (event) => {
  // ── 1. Validate body ────────────────────────────────────────────────────
  const body   = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message:    parsed.error.issues[0]?.message ?? 'Validation error',
    })
  }

  const { email, password, name } = parsed.data
  const db = useDb()

  // ── 2. Check for duplicate email ────────────────────────────────────────
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      message:    'An account with that email already exists',
    })
  }

  // ── 3. Hash password + create user ──────────────────────────────────────
  const hash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      email:    email.toLowerCase(),
      password: hash,
      name:     name.trim(),
      role:     'user',
    })
    .returning({
      id:        users.id,
      email:     users.email,
      name:      users.name,
      role:      users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  // ── 4. Set session cookie ────────────────────────────────────────────────
  const sessionData: AppSession = {
    userId: user.id,
    email:  user.email,
    name:   user.name,
    role:   user.role,
  }

  await setUserSession(event, { user: sessionData })

  // ── 5. Return public user (no password) ─────────────────────────────────
  setResponseStatus(event, 201)
  return { user }
})