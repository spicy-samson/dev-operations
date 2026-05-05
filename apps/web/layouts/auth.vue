<template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo / App name -->
        <div class="text-center mb-8">
          <NuxtLink to="/" class="text-2xl font-bold text-gray-900">
            {{ config.public.appName }}
          </NuxtLink>
        </div>
  
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <slot />
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  const config = useRuntimeConfig()
  </script>