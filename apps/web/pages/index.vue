<template>
  <div class="min-h-screen bg-white">
    <!-- Nav -->
    <header class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      <span class="text-lg font-bold text-gray-900">{{ config.public.appName }}</span>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          Log in
        </NuxtLink>
        <NuxtLink
          to="/auth/signup"
          class="text-sm font-medium px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Get started
        </NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <main class="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-6">
        🚀 Built with Nuxt 3 · Drizzle · AWS · Cloudflare
      </div>

      <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
        Ship your SaaS<br />
        <span class="text-gray-400">faster than ever</span>
      </h1>

      <p class="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
        A full-stack SaaS starter with auth, project management,
        file uploads, and an admin panel — ready to go.
      </p>

      <div class="flex items-center justify-center gap-4">
        <NuxtLink
          to="/auth/signup"
          class="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition text-sm"
        >
          Start for free →
        </NuxtLink>
        <NuxtLink
          to="/auth/login"
          class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
        >
          Sign in
        </NuxtLink>
      </div>
    </main>

    <!-- Feature grid -->
    <section class="max-w-5xl mx-auto px-6 pb-24">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bg-gray-50 rounded-2xl p-6 border border-gray-100"
        >
          <div class="text-2xl mb-3">{{ feature.icon }}</div>
          <h3 class="text-sm font-semibold text-gray-900 mb-1">{{ feature.title }}</h3>
          <p class="text-sm text-gray-500">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
      Built on AWS Free Tier + Cloudflare · Made with ❤️ in the Philippines
    </footer>
  </div>
</template>

<script setup lang="ts">
// Redirect to dashboard if already logged in
definePageMeta({ middleware: 'guest' })

const config = useRuntimeConfig()

const features = [
  {
    icon:        '🔐',
    title:       'Auth built-in',
    description: 'Email/password signup and login with argon2 hashing and httpOnly session cookies.',
  },
  {
    icon:        '📋',
    title:       'Project management',
    description: 'Create projects, break them into tasks, and track progress on a kanban board.',
  },
  {
    icon:        '📎',
    title:       'File uploads',
    description: 'Drag-and-drop uploads go directly to S3 via presigned URLs — no server bottleneck.',
  },
  {
    icon:        '🛡️',
    title:       'Admin panel',
    description: 'Site-wide stats and user management with role-based access control.',
  },
  {
    icon:        '💳',
    title:       'Billing ready',
    description: 'Plan pages and usage tracking are ready. Wire up Stripe when you need it.',
  },
  {
    icon:        '🚀',
    title:       'Deploy anywhere',
    description: 'Docker + Nginx on EC2, behind Cloudflare. Full IaC with CloudFormation.',
  },
]
</script>