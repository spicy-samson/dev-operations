<template>
  <div>
    <!-- Welcome -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Good {{ timeOfDay }}, {{ user?.name?.split(' ')[0] }} 👋
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ today }} · Here's what's going on.
      </p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
      >
        <div class="text-3xl">{{ stat.icon }}</div>
        <div>
          <p class="text-2xl font-bold text-gray-900">
            {{ statsLoading ? '—' : stat.value }}
          </p>
          <p class="text-sm text-gray-500">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Two column layout: recent projects + quick actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Recent projects (2/3 width) -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Recent projects</h2>
          <NuxtLink
            to="/projects"
            class="text-xs text-gray-500 hover:text-gray-900 font-medium"
          >
            View all →
          </NuxtLink>
        </div>

        <div v-if="projectsLoading" class="text-sm text-gray-400 text-center py-6">
          Loading…
        </div>

        <AppEmptyState
          v-else-if="recentProjects.length === 0"
          icon="📁"
          title="No projects yet"
          description="Create your first project to get started."
        >
          <NuxtLink
            to="/projects"
            class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
          >
            New project
          </NuxtLink>
        </AppEmptyState>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="py-3 flex items-center justify-between group"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
                📋
              </div>
              <div class="min-w-0">
                <NuxtLink
                  :to="`/projects/${project.id}`"
                  class="text-sm font-medium text-gray-900 hover:underline truncate block"
                >
                  {{ project.name }}
                </NuxtLink>
                <p class="text-xs text-gray-400">{{ formatDate(project.createdAt) }}</p>
              </div>
            </div>
            <AppBadge :variant="statusVariant(project.status)" class="ml-3 shrink-0">
              {{ project.status }}
            </AppBadge>
          </div>
        </div>
      </div>

      <!-- Quick actions (1/3 width) -->
      <div class="space-y-4">
        <!-- Quick action cards -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div class="space-y-2">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <span class="text-lg">{{ action.icon }}</span>
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- Admin shortcut (only for admins) -->
        <div
          v-if="isAdmin"
          class="bg-purple-50 border border-purple-100 rounded-xl p-5"
        >
          <p class="text-sm font-semibold text-purple-900 mb-1">Admin access</p>
          <p class="text-xs text-purple-600 mb-3">You have admin privileges.</p>
          <NuxtLink
            to="/admin"
            class="block text-center text-xs font-medium px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Open admin panel
          </NuxtLink>
        </div>

        <!-- Account card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 mb-2">Signed in as</p>
          <p class="text-sm font-semibold text-gray-900 truncate">{{ user?.name }}</p>
          <p class="text-xs text-gray-400 truncate mb-3">{{ user?.email }}</p>
          <AppBadge :variant="user?.role === 'admin' ? 'purple' : 'gray'">
            {{ user?.role }}
          </AppBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/server/db/schema'

definePageMeta({ layout: 'app', middleware: 'auth' })

const { user, isAdmin } = useAuth()

// ── Stats ──────────────────────────────────────────────────────────────────
const { data: statsData, pending: statsLoading } = await useFetch('/api/dashboard/stats', {
  default: () => ({ projects: 0, tasks: 0, uploads: 0 }),
})

const stats = computed(() => [
  { label: 'Projects', value: statsData.value?.projects, icon: '📋' },
  { label: 'Tasks',    value: statsData.value?.tasks,    icon: '✅' },
  { label: 'Uploads',  value: statsData.value?.uploads,  icon: '📎' },
])

// ── Recent projects ────────────────────────────────────────────────────────
const { data: projectsData, pending: projectsLoading } = await useFetch<{ projects: Project[] }>(
  '/api/projects',
  { default: () => ({ projects: [] }) },
)

const recentProjects = computed(() =>
  (projectsData.value?.projects ?? []).slice(0, 5),
)

// ── Quick actions ──────────────────────────────────────────────────────────
const quickActions = computed(() => {
  const base = [
    { to: '/projects', icon: '📋', label: 'New project' },
    { to: '/uploads',  icon: '📎', label: 'Upload a file' },
    { to: '/billing',  icon: '💳', label: 'View billing' },
  ]
  return isAdmin.value
    ? [...base, { to: '/admin', icon: '🛡️', label: 'Admin panel' }]
    : base
})

// ── Greeting helpers ───────────────────────────────────────────────────────
const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

const today = computed(() =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  }),
)

// ── Formatting helpers ─────────────────────────────────────────────────────
const statusVariant = (s: Project['status']): 'green' | 'gray' | 'blue' => ({
  active:    'green',
  archived:  'gray',
  completed: 'blue',
}[s] as any)

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
</script>