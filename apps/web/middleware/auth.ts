import { useAuth } from "~/composables/useAuth"

/**
 * middleware/auth.ts
 *
 * Named route middleware — add to any page that requires login:
 *
 *   definePageMeta({ middleware: 'auth' })
 *
 * Redirects unauthenticated users to /auth/login,
 * preserving the intended destination in the `redirect` query param.
 */
export default defineNuxtRouteMiddleware((to) => {
    const { isLoggedIn } = useAuth()
  
    if (!isLoggedIn.value) {
      return navigateTo({
        path:  '/auth/login',
        query: { redirect: to.fullPath },
      })
    }
  })