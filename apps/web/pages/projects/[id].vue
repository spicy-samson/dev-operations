<template>
    <div>
      <!-- Back -->
      <NuxtLink to="/projects" class="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
        ← Projects
      </NuxtLink>
  
      <!-- Project header -->
      <div v-if="project" class="mb-8">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ project.name }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ project.description }}</p>
          </div>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium mt-1"
            :class="statusClass(project.status)"
          >
            {{ project.status }}
          </span>
        </div>
      </div>
  
      <!-- Tasks section -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">
            Tasks <span class="text-gray-400 font-normal ml-1">({{ taskList.length }})</span>
          </h2>
          <button
            @click="showAddTask = true"
            class="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition"
          >
            + Add task
          </button>
        </div>
  
        <!-- Task columns -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="col in columns"
            :key="col.status"
            class="bg-gray-50 rounded-lg p-3"
          >
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {{ col.label }} ({{ col.tasks.length }})
            </p>
            <div class="space-y-2">
              <div
                v-for="task in col.tasks"
                :key="task.id"
                class="bg-white rounded-lg border border-gray-200 p-3 group"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-gray-900 leading-snug">{{ task.title }}</p>
                  <span class="shrink-0 text-xs px-1.5 py-0.5 rounded font-medium" :class="priorityClass(task.priority)">
                    {{ task.priority }}
                  </span>
                </div>
                <p v-if="task.description" class="text-xs text-gray-400 mt-1 line-clamp-2">
                  {{ task.description }}
                </p>
                <!-- Status cycle + delete -->
                <div class="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    @click="cycleStatus(task)"
                    class="text-xs text-blue-500 hover:text-blue-700"
                  >
                    → {{ nextStatus(task.status) }}
                  </button>
                  <button
                    @click="handleDeleteTask(task)"
                    class="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p v-if="col.tasks.length === 0" class="text-xs text-gray-300 text-center py-4">
                Empty
              </p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add task modal -->
      <div
        v-if="showAddTask"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showAddTask = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">New task</h2>
          <form @submit.prevent="handleAddTask" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                v-model="taskForm.title"
                type="text"
                required
                placeholder="What needs to be done?"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="taskForm.description"
                rows="2"
                placeholder="Optional details…"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  v-model="taskForm.priority"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  v-model="taskForm.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <p v-if="taskError" class="text-sm text-red-600">{{ taskError }}</p>
            <div class="flex gap-3 justify-end">
              <button type="button" @click="showAddTask = false" class="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button
                type="submit"
                :disabled="savingTask"
                class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
              >
                {{ savingTask ? 'Adding…' : 'Add task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { Project, Task } from '~/server/db/schema'
  
  definePageMeta({ layout: 'app', middleware: 'auth' })
  
  const route = useRoute()
  const id    = route.params.id as string
  
  const { createTask, updateTask, deleteTask } = useProjects()
  
  // Fetch project + tasks on load
  const { data, error } = await useFetch<{ project: Project; tasks: Task[] }>(
    `/api/projects/${id}`,
  )
  
  const project  = computed(() => data.value?.project)
  const taskList = ref<Task[]>(data.value?.tasks ?? [])
  
  // Kanban columns
  const columns = computed(() => [
    { status: 'todo',        label: 'To do',       tasks: taskList.value.filter(t => t.status === 'todo') },
    { status: 'in_progress', label: 'In progress', tasks: taskList.value.filter(t => t.status === 'in_progress') },
    { status: 'done',        label: 'Done',        tasks: taskList.value.filter(t => t.status === 'done') },
  ])
  
  // Add task
  const showAddTask = ref(false)
  const savingTask  = ref(false)
  const taskError   = ref('')
  const taskForm    = reactive({ title: '', description: '', priority: 'medium' as Task['priority'], status: 'todo' as Task['status'] })
  
  async function handleAddTask() {
    savingTask.value = true; taskError.value = ''
    try {
      const task = await createTask(id, { ...taskForm })
      taskList.value.push(task)
      showAddTask.value = false
      taskForm.title = ''; taskForm.description = ''
    } catch (err: any) {
      taskError.value = err?.data?.message ?? 'Failed to add task'
    } finally { savingTask.value = false }
  }
  
  // Cycle status on click
  const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'done']
  const nextStatus = (s: Task['status']) => STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % 3]
  
  async function cycleStatus(task: Task) {
    const next = nextStatus(task.status)
    try {
      const updated = await updateTask(id, task.id, { status: next })
      const idx = taskList.value.findIndex(t => t.id === task.id)
      if (idx !== -1) taskList.value[idx] = updated
    } catch { alert('Failed to update task.') }
  }
  
  async function handleDeleteTask(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await deleteTask(id, task.id)
      taskList.value = taskList.value.filter(t => t.id !== task.id)
    } catch { alert('Failed to delete task.') }
  }
  
  // Styling helpers
  const statusClass = (s: Project['status']) => ({
    active: 'bg-green-100 text-green-700', archived: 'bg-gray-100 text-gray-500', completed: 'bg-blue-100 text-blue-700',
  }[s])
  
  const priorityClass = (p: Task['priority']) => ({
    low: 'bg-gray-100 text-gray-500', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-600',
  }[p])
  </script>