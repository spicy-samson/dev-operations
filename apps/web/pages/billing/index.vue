<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Billing</h1>
      <p class="text-sm text-gray-500 mt-0.5">Manage your plan and payment details.</p>
    </div>

    <!-- Current plan banner -->
    <div class="bg-gray-900 text-white rounded-2xl p-6 mb-8 flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Current plan</p>
        <p class="text-2xl font-bold mb-0.5">Free</p>
        <p class="text-sm text-gray-400">You're on the free plan. Upgrade anytime.</p>
      </div>
      <div class="text-4xl">🎉</div>
    </div>

    <!-- Plan cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="rounded-2xl border p-6 flex flex-col"
        :class="plan.current
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-300 transition'"
      >
        <div class="flex items-center justify-between mb-4">
          <p class="font-bold text-gray-900 text-lg">{{ plan.name }}</p>
          <AppBadge v-if="plan.current" variant="gray">Current</AppBadge>
        </div>

        <p class="text-3xl font-bold text-gray-900 mb-1">
          {{ plan.price }}
          <span class="text-sm font-normal text-gray-400">{{ plan.period }}</span>
        </p>
        <p class="text-sm text-gray-500 mb-5">{{ plan.description }}</p>

        <ul class="space-y-2 mb-6 flex-1">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center gap-2 text-sm text-gray-600"
          >
            <span class="text-green-500 font-bold shrink-0">✓</span>
            {{ feature }}
          </li>
        </ul>

        <button
          :disabled="plan.current"
          @click="handleUpgrade(plan.name)"
          class="w-full py-2.5 rounded-xl text-sm font-medium transition"
          :class="plan.current
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : plan.highlighted
              ? 'bg-gray-900 text-white hover:bg-gray-700'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'"
        >
          {{ plan.current ? 'Current plan' : `Upgrade to ${plan.name}` }}
        </button>
      </div>
    </div>

    <!-- Coming soon notice -->
    <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
      <span class="text-2xl shrink-0">🔧</span>
      <div>
        <p class="text-sm font-semibold text-blue-900 mb-1">Billing is coming soon</p>
        <p class="text-sm text-blue-700">
          Payment processing via Stripe will be wired up in a future release.
          For now, everyone gets the free plan. Stay tuned!
        </p>
      </div>
    </div>

    <!-- Usage stats -->
    <div class="mt-8 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Your usage</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div v-for="stat in usageStats" :key="stat.label">
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-sm text-gray-600">{{ stat.label }}</p>
            <p class="text-sm font-semibold text-gray-900">{{ stat.used }} / {{ stat.limit }}</p>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="stat.pct > 80 ? 'bg-red-400' : stat.pct > 50 ? 'bg-yellow-400' : 'bg-green-400'"
              :style="{ width: `${stat.pct}%` }"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ stat.pct }}% used</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth' })

const plans = [
  {
    name:        'Free',
    price:       '$0',
    period:      '/ month',
    description: 'For personal projects and exploration.',
    current:     true,
    highlighted: false,
    features: [
      '3 projects',
      '50 tasks per project',
      '500 MB storage',
      'Community support',
    ],
  },
  {
    name:        'Pro',
    price:       '$12',
    period:      '/ month',
    description: 'For professionals who need more.',
    current:     false,
    highlighted: true,
    features: [
      'Unlimited projects',
      'Unlimited tasks',
      '20 GB storage',
      'Priority support',
      'Custom domain',
    ],
  },
  {
    name:        'Team',
    price:       '$49',
    period:      '/ month',
    description: 'For teams building together.',
    current:     false,
    highlighted: false,
    features: [
      'Everything in Pro',
      'Up to 10 members',
      '100 GB storage',
      'Admin panel',
      'Audit logs',
      'SSO (coming soon)',
    ],
  },
]

// Fetch real usage stats from dashboard endpoint
const { data } = await useFetch('/api/dashboard/stats', {
  default: () => ({ projects: 0, tasks: 0, uploads: 0 }),
})

const usageStats = computed(() => [
  {
    label: 'Projects',
    used:  data.value?.projects ?? 0,
    limit: 3,
    pct:   Math.min(100, Math.round(((data.value?.projects ?? 0) / 3) * 100)),
  },
  {
    label: 'Tasks',
    used:  data.value?.tasks ?? 0,
    limit: 150,
    pct:   Math.min(100, Math.round(((data.value?.tasks ?? 0) / 150) * 100)),
  },
  {
    label: 'Uploads',
    used:  data.value?.uploads ?? 0,
    limit: 50,
    pct:   Math.min(100, Math.round(((data.value?.uploads ?? 0) / 50) * 100)),
  },
])

function handleUpgrade(plan: string) {
  // Stripe integration goes here in a future step
  alert(`Stripe billing for ${plan} coming soon! 🚀`)
}
</script>