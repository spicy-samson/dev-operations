/**
 * server/utils/validate.ts
 *
 * Thin wrapper around Zod so every API route gets consistent
 * 422 errors with a clear message instead of raw Zod output.
 *
 * Usage:
 *   const body = await validateBody(event, mySchema)
 *   const { id } = validateParams(event, paramsSchema)
 */
import { z, type ZodTypeAny } from 'zod'
import type { H3Event }       from 'h3'

export async function validateBody<T extends ZodTypeAny>(
  event:  H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const body   = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      message:    result.error.issues[0]?.message ?? 'Validation error',
      data:       result.error.issues,
    })
  }

  return result.data
}

export function validateParams<T extends ZodTypeAny>(
  event:  H3Event,
  schema: T,
): z.infer<T> {
  const params = getRouterParams(event)
  const result = schema.safeParse(params)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message:    result.error.issues[0]?.message ?? 'Invalid params',
    })
  }

  return result.data
}

// Shared param schemas reused across routes
export const uuidParam = z.object({
  id: z.string().uuid('Invalid ID format'),
})

/** `/api/projects/:id/tasks` — dynamic segment is `id` (matches `[id]` routes) */
export const projectIdSegmentParam = z.object({
  id: z.string().uuid('Invalid project ID'),
})

export const taskIdParam = z.object({
  taskId: z.string().uuid('Invalid task ID'),
})