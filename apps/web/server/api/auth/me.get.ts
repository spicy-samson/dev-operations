/**
 * GET /api/auth/me
 *
 * Returns the current logged-in user from the session.
 * Used by the useAuth() composable to rehydrate state on page load.
 */
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  return { user: session }
})