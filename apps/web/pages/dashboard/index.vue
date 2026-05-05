<template>
    <div>
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {{ user?.name }} 👋
        </h1>
        <p class="text-gray-500 text-sm mt-1">Here's what's happening with your projects.</p>
      </div>
  
      <!-- Stats row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p class="text-sm text-gray-500 mb-1">{{ stat.label }}</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ pending ? '—' : stat.value }}
          </p>
        </div>
      </div>
  
      <!-- Quick actions -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/projects"
            class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
          >
            View projects
          </NuxtLink>
          <NuxtLink
            to="/uploads"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Upload a file
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Admin panel
          </NuxtLink>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  definePageMeta({
    layout:     'app',
    middleware: 'auth',   // 🔒 protected
  })
  
  const { user, isAdmin } = useAuth()
  
  // Fetch summary stats — will be real data after Step 5 (CRUD API)
  const { data, pending } = await useFetch('/api/dashboard/stats', {
    // Don't throw on error — gracefully degrade with zeros
    default: () => ({ projects: 0, tasks: 0, uploads: 0 }),
  })
  
  const stats = computed(() => [
    { label: 'Projects', value: data.value?.projects ?? 0 },
    { label: 'Tasks',    value: data.value?.tasks    ?? 0 },
    { label: 'Uploads',  value: data.value?.uploads  ?? 0 },
  ])
  </script>