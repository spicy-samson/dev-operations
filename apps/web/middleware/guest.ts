import { useAuth } from "~/composables/useAuth"

/**
 * middleware/guest.ts
 *
 * Named route middleware — add to login/signup pages so already-logged-in
 * users are bounced straight to the dashboard:
 *
 *   definePageMeta({ middleware: 'guest' })
 */
export default defineNuxtRouteMiddleware(() => {
    const { isLoggedIn } = useAuth()
  
    if (isLoggedIn.value) {
      return navigateTo('/dashboard')
    }
  })