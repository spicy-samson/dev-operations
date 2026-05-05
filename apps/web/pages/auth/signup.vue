<template>
    <div>
      <h1 class="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
      <p class="text-sm text-gray-500 mb-6">Get started for free</p>
  
      <form @submit.prevent="handleSignup" class="space-y-4">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            required
            placeholder="Juan dela Cruz"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                   disabled:opacity-50"
            :disabled="loading"
          />
        </div>
  
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
            <span class="text-gray-400 font-normal">(min 8 characters)</span>
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
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
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
  
      <p class="mt-6 text-center text-sm text-gray-500">
        Already have an account?
        <NuxtLink to="/auth/login" class="font-medium text-gray-900 hover:underline">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  definePageMeta({
    layout:     'auth',
    middleware: 'guest',
  })
  
  const { signup } = useAuth()
  
  const form = reactive({ name: '', email: '', password: '' })
  const loading = ref(false)
  const error   = ref('')
  
  async function handleSignup() {
    loading.value = true
    error.value   = ''
  
    try {
      await signup({
        name:     form.name,
        email:    form.email,
        password: form.password,
      })
      await navigateTo('/dashboard')
    } catch (err: any) {
      error.value = err?.data?.message ?? err?.message ?? 'Something went wrong'
    } finally {
      loading.value = false
    }
  }
  </script>