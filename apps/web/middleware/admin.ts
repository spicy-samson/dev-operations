import { useAuth } from "~/composables/useAuth"

/**
 * middleware/admin.ts
 *
 * Named route middleware — add to admin-only pages:
 *
 *   definePageMeta({ middleware: ['auth', 'admin'] })
 *
 * Redirects non-admins to /dashboard.
 */
export default defineNuxtRouteMiddleware(() => {
    const { isAdmin, isLoggedIn } = useAuth()
  
    if (!isLoggedIn.value) {
      return navigateTo('/auth/login')
    }
  
    if (!isAdmin.value) {
      return navigateTo('/dashboard')
    }
  })