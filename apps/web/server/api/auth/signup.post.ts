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
import { useEnv }          from '~/server/utils/env'
import type { AppSession } from '~/server/utils/auth'
import { timingSafeEqual } from 'node:crypto'

const bodySchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name:     z.string().min(1, 'Name is required').max(100),
  adminSetupKey: z.string().min(16).max(256).optional(),
})

function secureCompare(secret: string, input: string): boolean {
  const secretBuffer = Buffer.from(secret)
  const inputBuffer = Buffer.from(input)
  if (secretBuffer.length !== inputBuffer.length) return false
  return timingSafeEqual(secretBuffer, inputBuffer)
}

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

  const { email, password, name, adminSetupKey } = parsed.data
  const db = useDb()
  const env = useEnv()

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

  // ── 3. Decide role (admin bootstrap is key-gated + one-time) ────────────
  let role: 'user' | 'admin' = 'user'

  if (adminSetupKey) {
    if (!env.ADMIN_SETUP_KEY) {
      throw createError({
        statusCode: 403,
        message: 'Admin signup is not enabled',
      })
    }

    if (!secureCompare(env.ADMIN_SETUP_KEY, adminSetupKey)) {
      throw createError({
        statusCode: 403,
        message: 'Invalid admin setup key',
      })
    }

    const existingAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1)

    if (existingAdmins.length > 0) {
      throw createError({
        statusCode: 409,
        message: 'Admin account already exists. Ask an admin to promote your account.',
      })
    }

    role = 'admin'
  }

  // ── 4. Hash password + create user ──────────────────────────────────────
  const hash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      email:    email.toLowerCase(),
      password: hash,
      name:     name.trim(),
      role,
    })
    .returning({
      id:        users.id,
      email:     users.email,
      name:      users.name,
      role:      users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  // ── 5. Set session cookie ────────────────────────────────────────────────
  const sessionData: AppSession = {
    userId: user.id,
    email:  user.email,
    name:   user.name,
    role:   user.role,
  }

  await setUserSession(event, { user: sessionData })

  // ── 6. Return public user (no password) ─────────────────────────────────
  setResponseStatus(event, 201)
  return { user }
})