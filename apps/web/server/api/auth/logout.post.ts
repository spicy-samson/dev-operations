/**
 * POST /api/auth/logout
 *
 * Clears the session cookie.
 * Always returns 200 — even if not logged in (idempotent).
 */
export default defineEventHandler(async (event) => {
    await clearUserSession(event)
    return { ok: true }
  })