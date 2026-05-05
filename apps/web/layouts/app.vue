<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Top nav -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <!-- Left: Logo + nav links -->
          <div class="flex items-center gap-6">
            <NuxtLink to="/dashboard" class="text-base font-bold text-gray-900">
              {{ config.public.appName }}
            </NuxtLink>
            <nav class="hidden sm:flex items-center gap-1">
              <NuxtLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition"
                active-class="bg-gray-100 text-gray-900 font-medium"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>
  
          <!-- Right: user menu -->
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 hidden sm:block">
              {{ user?.name }}
            </span>
            <button
              @click="logout"
              class="text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5
                     rounded-lg hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
  
      <!-- Page content -->
      <main class="max-w-6xl mx-auto px-4 py-8">
        <slot />
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  const config      = useRuntimeConfig()
  const { user, logout, isAdmin } = useAuth()
  
  const baseLinks = [
    { to: '/dashboard',       label: 'Dashboard' },
    { to: '/projects',        label: 'Projects'  },
    { to: '/uploads',         label: 'Uploads'   },
    { to: '/billing',         label: 'Billing'   },
  ]
  
  const adminLinks = [
    { to: '/admin',           label: 'Admin'     },
  ]
  
  const navLinks = computed(() =>
    isAdmin.value ? [...baseLinks, ...adminLinks] : baseLinks
  )
  </script>