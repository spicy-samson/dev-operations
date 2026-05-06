<template>
    <div>
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Admin panel</h1>
        <p class="text-sm text-gray-500 mt-0.5">Site-wide overview and user management.</p>
      </div>
  
      <!-- Site stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          v-for="stat in siteStats"
          :key="stat.label"
          class="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-bold text-gray-900">
            {{ statsLoading ? '—' : stat.value }}
          </p>
        </div>
      </div>
  
      <!-- Users table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">
            Users
            <span class="ml-1.5 text-sm font-normal text-gray-400">({{ users.length }})</span>
          </h2>
          <!-- Search -->
          <input
            v-model="search"
            type="text"
            placeholder="Search by name or email…"
            class="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-56"
          />
        </div>
  
        <!-- Loading -->
        <div v-if="usersLoading" class="text-center py-12 text-sm text-gray-400">Loading users…</div>
  
        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploads</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="u in filteredUsers"
                :key="u.id"
                class="hover:bg-gray-50 transition"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-gray-900">{{ u.name }}</p>
                  <p class="text-xs text-gray-400">{{ u.email }}</p>
                </td>
                <td class="px-6 py-4">
                  <AppBadge :variant="u.role === 'admin' ? 'purple' : 'gray'">
                    {{ u.role }}
                  </AppBadge>
                </td>
                <td class="px-6 py-4 text-gray-600">{{ u.projectCount }}</td>
                <td class="px-6 py-4 text-gray-600">{{ u.uploadCount }}</td>
                <td class="px-6 py-4 text-gray-400 text-xs">{{ formatDate(u.createdAt) }}</td>
                <td class="px-6 py-4 text-right">
                  <!-- Can't change your own role -->
                  <button
                    v-if="u.id !== currentUser?.userId"
                    @click="openRoleModal(u)"
                    class="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Change role
                  </button>
                  <span v-else class="text-xs text-gray-300">You</span>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="text-center py-10 text-sm text-gray-400">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- Change role modal -->
      <AppModal v-model="showRoleModal" title="Change user role" size="sm">
        <div v-if="selectedUser">
          <p class="text-sm text-gray-600 mb-4">
            Change role for <span class="font-semibold text-gray-900">{{ selectedUser.name }}</span>
          </p>
          <div class="flex flex-col gap-2 mb-5">
            <label
              v-for="r in (['user', 'admin'] as const)"
              :key="r"
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition"
              :class="newRole === r
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="newRole" type="radio" :value="r" class="accent-gray-900" />
              <div>
                <p class="text-sm font-medium text-gray-900 capitalize">{{ r }}</p>
                <p class="text-xs text-gray-400">
                  {{ r === 'admin' ? 'Full access to admin panel' : 'Standard user access' }}
                </p>
              </div>
            </label>
          </div>
          <p v-if="roleError" class="text-sm text-red-600 mb-3">{{ roleError }}</p>
          <div class="flex gap-3 justify-end">
            <button
              @click="showRoleModal = false"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              @click="handleRoleChange"
              :disabled="savingRole || newRole === selectedUser.role"
              class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700
                     disabled:opacity-50 transition"
            >
              {{ savingRole ? 'Saving…' : 'Save role' }}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </template>
  
  <script setup lang="ts">
  definePageMeta({ layout: 'app', middleware: ['auth', 'admin'] })
  
  const { user: currentUser } = useAuth()
  
  // ── Stats ──────────────────────────────────────────────────────────────────
  const { data: statsData, pending: statsLoading } = await useFetch('/api/admin/stats')
  
  const siteStats = computed(() => [
    { label: 'Total users',    value: statsData.value?.users    ?? 0 },
    { label: 'Projects',       value: statsData.value?.projects ?? 0 },
    { label: 'Tasks',          value: statsData.value?.tasks    ?? 0 },
    { label: 'Uploads',        value: statsData.value?.uploads  ?? 0 },
  ])
  
  // ── Users ──────────────────────────────────────────────────────────────────
  type AdminUser = {
    id: string; email: string; name: string
    role: 'user' | 'admin'; createdAt: string
    projectCount: number; uploadCount: number
  }
  
  const { data: usersData, pending: usersLoading, refresh } = await useFetch<{ users: AdminUser[] }>('/api/admin/users')
  const users = computed(() => usersData.value?.users ?? [])
  
  // Search filter
  const search = ref('')
  const filteredUsers = computed(() => {
    const q = search.value.toLowerCase()
    if (!q) return users.value
    return users.value.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  })
  
  // ── Role modal ─────────────────────────────────────────────────────────────
  const showRoleModal = ref(false)
  const selectedUser  = ref<AdminUser | null>(null)
  const newRole       = ref<'user' | 'admin'>('user')
  const savingRole    = ref(false)
  const roleError     = ref('')
  
  function openRoleModal(u: AdminUser) {
    selectedUser.value = u
    newRole.value      = u.role
    roleError.value    = ''
    showRoleModal.value = true
  }
  
  async function handleRoleChange() {
    if (!selectedUser.value) return
    savingRole.value = true
    roleError.value  = ''
    try {
      await $fetch(`/api/admin/users/${selectedUser.value.id}/role`, {
        method: 'PATCH',
        body:   { role: newRole.value },
      })
      showRoleModal.value = false
      await refresh()
    } catch (err: any) {
      roleError.value = err?.data?.message ?? 'Failed to update role'
    } finally {
      savingRole.value = false
    }
  }
  
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }
  </script>