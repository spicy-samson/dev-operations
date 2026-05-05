/**
 * server/utils/ownership.ts
 *
 * Reusable ownership guards.
 * Always call requireAuth first, then pass the session into these.
 *
 * Usage in any API route:
 *   const session = await requireAuth(event)
 *   const project = await requireProjectOwnership(projectId, session.userId)
 *   const task    = await requireTaskOwnership(taskId, session.userId)
 */
import { eq, and }   from 'drizzle-orm'
import { useDb }     from '~/server/db/client'
import { projects, tasks } from '~/server/db/schema'
import type { Project, Task } from '~/server/db/schema'

// ── Projects ──────────────────────────────────────────────────────────────

export async function requireProjectOwnership(
  projectId: string,
  userId:    string,
): Promise<Project> {
  const db = useDb()

  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id,     projectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1)

  if (!project) {
    // 404 instead of 403 — don't leak existence of other users' projects
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  return project
}

// ── Tasks ─────────────────────────────────────────────────────────────────
// Tasks don't store userId directly — ownership is verified through the project.

export async function requireTaskOwnership(
  taskId: string,
  userId: string,
): Promise<Task & { project: Project }> {
  const db = useDb()

  const [row] = await db
    .select({ task: tasks, project: projects })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.id,        taskId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Task not found' })
  }

  return { ...row.task, project: row.project }
}