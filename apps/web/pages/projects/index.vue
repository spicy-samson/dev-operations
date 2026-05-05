<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ projects.length }} project{{ projects.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        @click="showCreate = true"
        class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
      >
        + New project
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-sm text-gray-400 py-12 text-center">Loading…</div>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{{ error }}</p>

    <!-- Empty state -->
    <div
      v-else-if="projects.length === 0"
      class="text-center py-16 bg-white rounded-xl border border-gray-200"
    >
      <p class="text-gray-400 text-sm mb-4">No projects yet.</p>
      <button
        @click="showCreate = true"
        class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
      >
        Create your first project
      </button>
    </div>

    <!-- Project grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="project in projects"
        :key="project.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition group"
      >
        <div class="flex items-start justify-between mb-3">
          <NuxtLink
            :to="`/projects/${project.id}`"
            class="font-semibold text-gray-900 hover:underline line-clamp-1"
          >
            {{ project.name }}
          </NuxtLink>
          <span
            class="ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusClass(project.status)"
          >
            {{ project.status }}
          </span>
        </div>
        <p class="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
          {{ project.description || 'No description.' }}
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ formatDate(project.createdAt) }}</span>
          <button
            @click="confirmDelete(project)"
            class="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="showCreate = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">New project</h2>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="My awesome project"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="What's this project about?"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          <div class="flex gap-3 justify-end">
            <button type="button" @click="showCreate = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {{ saving ? 'Creating…' : 'Create project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/server/db/schema'

definePageMeta({ layout: 'app', middleware: 'auth' })

const { projects, loading, error, fetchProjects, createProject, deleteProject } = useProjects()

const showCreate  = ref(false)
const saving      = ref(false)
const createError = ref('')
const form        = reactive({ name: '', description: '' })

onMounted(fetchProjects)

async function handleCreate() {
  saving.value = true; createError.value = ''
  try {
    await createProject({ name: form.name, description: form.description })
    showCreate.value = false; form.name = ''; form.description = ''
  } catch (err: any) {
    createError.value = err?.data?.message ?? 'Failed to create project'
  } finally { saving.value = false }
}

async function confirmDelete(project: Project) {
  if (!confirm(`Delete "${project.name}" and all its tasks?`)) return
  try { await deleteProject(project.id) }
  catch { alert('Failed to delete project.') }
}

const statusClass = (status: Project['status']) => ({
  active:    'bg-green-100 text-green-700',
  archived:  'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
}[status])

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
</script>