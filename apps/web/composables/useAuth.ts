/**
 * composables/useAuth.ts
 *
 * Client-side auth composable. Wraps nuxt-auth-utils' useUserSession
 * with typed helpers for login, signup, logout, and current user access.
 *
 * Usage in any .vue file:
 *   const { user, isLoggedIn, isAdmin, login, logout, signup } = useAuth()
 */
import type { AppSession } from '~/server/utils/auth'

export function useAuth() {
  const { user, fetch: refreshSession, clear } = useUserSession()

  const typedUser = computed(() =>
    user.value ? (user.value as AppSession) : undefined,
  )
  const isLoggedIn = computed(() => !!typedUser.value)
  const isAdmin    = computed(() => typedUser.value?.role === 'admin')

  // ── signup ────────────────────────────────────────────────────────────────
  async function signup(payload: {
    email: string
    password: string
    name: string
    adminSetupKey?: string
  }) {
    const data = await $fetch('/api/auth/signup', {
      method: 'POST',
      body:   payload,
    })
    await refreshSession()
    return data
  }

  // ── login ─────────────────────────────────────────────────────────────────
  async function login(payload: { email: string; password: string }) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body:   payload,
    })
    await refreshSession()
    return data
  }

  // ── logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/auth/login')
  }

  return {
    user:       typedUser,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    signup,
    refreshSession,
  }
}