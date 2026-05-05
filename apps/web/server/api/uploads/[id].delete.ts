/**
 * DELETE /api/uploads/:id
 * Deletes the DB row AND the S3 object.
 * Ownership enforced — users can only delete their own uploads.
 */
import { eq, and }           from 'drizzle-orm'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { requireAuth }       from '~/server/utils/auth'
import { validateParams, uuidParam } from '~/server/utils/validate'
import { useDb }             from '~/server/db/client'
import { useS3, useS3Bucket } from '~/server/utils/s3'
import { uploads }           from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id }  = validateParams(event, uuidParam)
  const db      = useDb()

  // ── 1. Find + verify ownership ─────────────────────────────────────────
  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.userId, session.userId)))
    .limit(1)

  if (!upload) {
    throw createError({ statusCode: 404, message: 'Upload not found' })
  }

  // ── 2. Delete from S3 ──────────────────────────────────────────────────
  // Best-effort — don't fail the request if the S3 object is already gone
  try {
    const s3     = useS3()
    const bucket = useS3Bucket()
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: upload.s3Key }))
  } catch (err) {
    console.warn(`[uploads] S3 delete failed for key ${upload.s3Key}:`, err)
  }

  // ── 3. Delete DB row ───────────────────────────────────────────────────
  await db.delete(uploads).where(eq(uploads.id, id))

  setResponseStatus(event, 204)
  return null
})