/**
 * composables/useProjects.ts
 *
 * Client-side composable for projects + tasks CRUD.
 * Wraps $fetch with typed helpers so pages stay clean.
 *
 * Usage:
 *   const { projects, fetchProjects, createProject, ... } = useProjects()
 */
import type { Project, Task } from '~/server/db/schema'

export function useProjects() {
  const projects = useState<Project[]>('projects', () => [])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  // ── Projects ──────────────────────────────────────────────────────────────

  async function fetchProjects() {
    loading.value = true
    error.value   = null
    try {
      const data = await $fetch<{ projects: Project[] }>('/api/projects')
      projects.value = data.projects
    } catch (err: any) {
      error.value = err?.data?.message ?? 'Failed to load projects'
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id: string) {
    const data = await $fetch<{ project: Project; tasks: Task[] }>(
      `/api/projects/${id}`,
    )
    return data
  }

  async function createProject(payload: {
    name: string
    description?: string
    status?: Project['status']
  }) {
    const data = await $fetch<{ project: Project }>('/api/projects', {
      method: 'POST',
      body:   payload,
    })
    projects.value.unshift(data.project)
    return data.project
  }

  async function updateProject(
    id:      string,
    payload: Partial<Pick<Project, 'name' | 'description' | 'status'>>,
  ) {
    const data = await $fetch<{ project: Project }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body:   payload,
    })
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = data.project
    return data.project
  }

  async function deleteProject(id: string) {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    projects.value = projects.value.filter(p => p.id !== id)
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async function createTask(
    projectId: string,
    payload: {
      title:        string
      description?: string
      status?:      Task['status']
      priority?:    Task['priority']
      dueDate?:     string | null
    },
  ) {
    const data = await $fetch<{ task: Task }>(
      `/api/projects/${projectId}/tasks`,
      { method: 'POST', body: payload },
    )
    return data.task
  }

  async function updateTask(
    projectId: string,
    taskId:    string,
    payload:   Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'position'> & { dueDate: string | null }>,
  ) {
    const data = await $fetch<{ task: Task }>(
      `/api/projects/${projectId}/tasks/${taskId}`,
      { method: 'PATCH', body: payload },
    )
    return data.task
  }

  async function deleteTask(projectId: string, taskId: string) {
    await $fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  }
}