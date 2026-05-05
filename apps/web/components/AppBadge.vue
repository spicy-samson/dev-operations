<template>
    <span
      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      :class="classes"
    >
      <slot />
    </span>
  </template>
  
  <script setup lang="ts">
  const props = defineProps<{
    variant: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple'
  }>()
  
  const classes = computed(() => ({
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100  text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-100   text-red-600',
    gray:   'bg-gray-100  text-gray-500',
    purple: 'bg-purple-100 text-purple-700',
  }[props.variant]))
  </script>