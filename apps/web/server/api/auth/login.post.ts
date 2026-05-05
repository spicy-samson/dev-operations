/**
 * POST /api/auth/login
 *
 * Authenticates with email + password.
 * On success, sets the encrypted httpOnly session cookie.
 */
import { z }               from 'zod'
import { eq }              from 'drizzle-orm'
import { useDb }           from '~/server/db/client'
import { users }           from '~/server/db/schema'
import { verifyPassword }  from '~/server/utils/auth'
import type { AppSession } from '~/server/utils/auth'

const bodySchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
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

  const { email, password } = parsed.data
  const db = useDb()

  // ── 2. Look up user ─────────────────────────────────────────────────────
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  // ── 3. Verify password ──────────────────────────────────────────────────
  // We always run verifyPassword even if user is not found
  // to prevent timing attacks that reveal valid emails.
  const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$dummyhashtopreventtiming'
  const passwordHash = user?.password ?? DUMMY_HASH
  const valid = await verifyPassword(passwordHash, password)

  if (!user || !valid) {
    throw createError({
      statusCode: 401,
      // Deliberately vague — don't tell the client which one was wrong
      message: 'Invalid email or password',
    })
  }

  // ── 4. Set session cookie ────────────────────────────────────────────────
  const sessionData: AppSession = {
    userId: user.id,
    email:  user.email,
    name:   user.name,
    role:   user.role,
  }

  await setUserSession(event, { user: sessionData })

  // ── 5. Return public user ────────────────────────────────────────────────
  return {
    user: {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      role:      user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  }
})