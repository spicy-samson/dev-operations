<template>
    <div class="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
      <div class="text-4xl mb-3">{{ icon }}</div>
      <p class="text-sm font-medium text-gray-700 mb-1">{{ title }}</p>
      <p v-if="description" class="text-xs text-gray-400 mb-5 text-center max-w-xs">{{ description }}</p>
      <slot />
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    icon?:        string
    title:        string
    description?: string
  }>()
  </script>