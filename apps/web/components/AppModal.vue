<template>
    <Teleport to="body">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full p-6"
          :class="maxWidth"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
            <button
              @click="$emit('update:modelValue', false)"
              class="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  const props = defineProps<{
    modelValue: boolean
    title:      string
    size?:      'sm' | 'md' | 'lg'
  }>()
  
  defineEmits<{ 'update:modelValue': [boolean] }>()
  
  const maxWidth = computed(() => ({
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[props.size ?? 'md']))
  </script>