<template>
    <div>
      <h1 class="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
      <p class="text-sm text-gray-500 mb-6">Sign in to your account</p>
  
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                   disabled:opacity-50"
            :disabled="loading"
          />
        </div>
  
        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                   disabled:opacity-50"
            :disabled="loading"
          />
        </div>
  
        <!-- Error -->
        <p v-if="error" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {{ error }}
        </p>
  
        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium
                 rounded-lg hover:bg-gray-700 transition disabled:opacity-50
                 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
  
      <p class="mt-6 text-center text-sm text-gray-500">
        Don't have an account?
        <NuxtLink to="/auth/signup" class="font-medium text-gray-900 hover:underline">
          Sign up
        </NuxtLink>
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  definePageMeta({
    layout:     'auth',
    middleware: 'guest',   // redirect to /dashboard if already logged in
  })
  
  const { login } = useAuth()
  const route     = useRoute()
  
  const form = reactive({ email: '', password: '' })
  const loading = ref(false)
  const error   = ref('')
  
  async function handleLogin() {
    loading.value = true
    error.value   = ''
  
    try {
      await login({ email: form.email, password: form.password })
  
      // Redirect to where they were trying to go, or dashboard
      const redirect = (route.query.redirect as string) || '/dashboard'
      await navigateTo(redirect)
    } catch (err: any) {
      error.value = err?.data?.message ?? err?.message ?? 'Something went wrong'
    } finally {
      loading.value = false
    }
  }
  </script>