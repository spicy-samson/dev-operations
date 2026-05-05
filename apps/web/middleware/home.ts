import { useAuth } from '~/composables/useAuth'
/** Root `/` → dashboard if session exists, else login */
export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn } = useAuth()
  return navigateTo(isLoggedIn.value ? '/dashboard' : '/auth/login', {
    replace: true,
  })
})
