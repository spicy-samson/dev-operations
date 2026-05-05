/**
 * GET /api/uploads
 * Returns all uploaded files for the current user.
 * Each item includes a short-lived presigned GET URL for viewing/downloading.
 */
import { eq, desc, and } from 'drizzle-orm'
import { GetObjectCommand }  from '@aws-sdk/client-s3'
import { getSignedUrl }      from '@aws-sdk/s3-request-presigner'
import { requireAuth }       from '~/server/utils/auth'
import { useDb }             from '~/server/db/client'
import { useS3, useS3Bucket } from '~/server/utils/s3'
import { uploads }           from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const db      = useDb()
  const s3      = useS3()
  const bucket  = useS3Bucket()

  // Only return successfully uploaded files (skip pending/failed)
  const rows = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.userId, session.userId),
        eq(uploads.status, 'uploaded'),
      ),
    )
    .orderBy(desc(uploads.createdAt))

  // Generate a presigned GET URL for each file (valid 1 hour)
  const items = await Promise.all(
    rows.map(async (upload) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket:                     bucket,
          Key:                        upload.s3Key,
          ResponseContentDisposition: `inline; filename="${encodeURIComponent(upload.fileName)}"`,
        }),
        { expiresIn: 3600 },
      )
      return { ...upload, url }
    }),
  )

  return { uploads: items }
})