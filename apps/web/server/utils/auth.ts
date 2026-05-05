/**
 * server/utils/auth.ts
 *
 * Shared server-side auth helpers.
 * - hashPassword / verifyPassword  → argon2
 * - requireAuth                    → throws 401 if no session
 * - requireAdmin                   → throws 403 if not admin
 * - getUserSession                 → returns typed session or null
 */
import argon2 from 'argon2'
import type { H3Event } from 'h3'
import { useDb } from '~/server/db/client'
import { users } from '~/server/db/schema'
import { eq }    from 'drizzle-orm'
import type { PublicUser } from '~/server/db/schema'

// ── Password hashing ──────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type:        argon2.argon2id,   // recommended variant
    memoryCost:  65536,             // 64 MB
    timeCost:    3,
    parallelism: 4,
  })
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

// ── Session shape stored in the cookie ────────────────────────────────────
// nuxt-auth-utils seals this into an encrypted httpOnly cookie.

export interface AppSession {
  userId: string
  email:  string
  name:   string
  role:   'user' | 'admin'
}

// ── requireAuth ───────────────────────────────────────────────────────────

export async function requireAuth(event: H3Event): Promise<AppSession> {
  const session = await getUserSession(event)

  if (!session?.userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized — please log in' })
  }

  return session
}

// ── requireAdmin ──────────────────────────────────────────────────────────

export async function requireAdmin(event: H3Event): Promise<AppSession> {
  const session = await requireAuth(event)

  if (session.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden — admin only' })
  }

  return session
}

// ── getUserSession ────────────────────────────────────────────────────────
// Returns the typed session data from the cookie, or null if not logged in.

export async function getUserSession(event: H3Event): Promise<AppSession | null> {
  try {
    // useUserSession is provided globally by nuxt-auth-utils in Nitro context
    const { user } = await useUserSession(event)
    if (!user) return null
    return user as AppSession
  } catch {
    return null
  }
}

// ── fetchPublicUser ────────────────────────────────────────────────────────
// Re-fetches user from DB — use when you need fresh data (e.g. after update)

export async function fetchPublicUser(userId: string): Promise<PublicUser | null> {
  const db = useDb()
  const rows = await db
    .select({
      id:        users.id,
      email:     users.email,
      name:      users.name,
      role:      users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return rows[0] ?? null
}