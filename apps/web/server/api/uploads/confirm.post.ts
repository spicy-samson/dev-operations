/**
 * POST /api/uploads/confirm
 *
 * Step 3 of the upload flow.
 * Called by the client AFTER it has successfully PUT the file to S3.
 * Flips the upload status from 'pending' → 'uploaded'.
 *
 * Also called with status:'failed' if the browser upload errored.
 */
import { z }            from 'zod'
import { eq, and }      from 'drizzle-orm'
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAuth }  from '~/server/utils/auth'
import { validateBody } from '~/server/utils/validate'
import { useDb }        from '~/server/db/client'
import { useS3, useS3Bucket } from '~/server/utils/s3'
import { uploads }      from '~/server/db/schema'

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  status:   z.enum(['uploaded', 'failed']),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body    = await validateBody(event, bodySchema)
  const db      = useDb()

  // ── 1. Find the pending upload row (must belong to this user) ──────────
  const [upload] = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.id,     body.uploadId),
        eq(uploads.userId, session.userId),
      ),
    )
    .limit(1)

  if (!upload) {
    throw createError({ statusCode: 404, message: 'Upload not found' })
  }

  if (upload.status !== 'pending') {
    throw createError({ statusCode: 409, message: `Upload already ${upload.status}` })
  }

  // ── 2. If confirming success, verify the object actually landed in S3 ──
  if (body.status === 'uploaded') {
    try {
      const s3     = useS3()
      const bucket = useS3Bucket()
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: upload.s3Key }))
    } catch {
      throw createError({
        statusCode: 422,
        message:    'File not found in S3 — upload may have failed',
      })
    }
  }

  // ── 3. Update status ────────────────────────────────────────────────────
  const [updated] = await db
    .update(uploads)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(uploads.id, body.uploadId))
    .returning()

  // Return a fresh view URL so the client can render/open immediately
  // without waiting for a separate GET /api/uploads refresh.
  let url = ''
  if (updated.status === 'uploaded') {
    const s3     = useS3()
    const bucket = useS3Bucket()
    url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: updated.s3Key,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(updated.fileName)}"`,
      }),
      { expiresIn: 3600 },
    )
  }

  return { upload: { ...updated, url } }
})