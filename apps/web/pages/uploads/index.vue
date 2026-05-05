<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2 capitalize">uploads</h1>
    <p class="text-gray-500 text-sm">Coming in Step {{ page == 'billing' ? '7' : page == 'uploads' ? '6' : '5' }}.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth' })
</script>
