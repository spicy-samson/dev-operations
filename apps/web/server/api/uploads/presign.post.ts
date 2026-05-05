/**
 * POST /api/uploads/presign
 *
 * Step 1 of the upload flow.
 * Client sends file metadata → server returns a presigned S3 PUT URL
 * + a pending upload row in the DB.
 *
 * The browser then PUTs the file bytes directly to S3 using that URL.
 * No file bytes ever touch this server.
 */
import { z }                  from 'zod'
import { PutObjectCommand }   from '@aws-sdk/client-s3'
import { getSignedUrl }       from '@aws-sdk/s3-request-presigner'
import { randomUUID }         from 'node:crypto'
import { requireAuth }        from '~/server/utils/auth'
import { validateBody }       from '~/server/utils/validate'
import { useS3, useS3Bucket } from '~/server/utils/s3'
import { useDb }              from '~/server/db/client'
import { uploads }            from '~/server/db/schema'

// Allowed MIME types — extend this list as needed
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const bodySchema = z.object({
  fileName:  z.string().min(1).max(500),
  mimeType:  z.string().refine(
    t => ALLOWED_MIME_TYPES.includes(t),
    { message: `File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
  ),
  size:      z.number().int().min(1).max(MAX_FILE_SIZE, `File must be under 50 MB`),
  projectId: z.string().uuid().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body    = await validateBody(event, bodySchema)
  const db      = useDb()
  const s3      = useS3()
  const bucket  = useS3Bucket()

  // ── 1. Build S3 key ────────────────────────────────────────────────────
  // Structure: uploads/<userId>/<uuid>-<sanitised-filename>
  // uuid prefix guarantees uniqueness even for duplicate filenames
  const ext      = body.fileName.split('.').pop()?.toLowerCase() ?? ''
  const safeName = body.fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // sanitise
    .substring(0, 200)
  const s3Key    = `uploads/${session.userId}/${randomUUID()}-${safeName}`

  // ── 2. Create pending DB row ───────────────────────────────────────────
  // We write the row BEFORE issuing the presigned URL so we always have a
  // record, even if the client never completes the upload.
  const [upload] = await db
    .insert(uploads)
    .values({
      userId:    session.userId,
      projectId: body.projectId ?? null,
      s3Key,
      fileName:  body.fileName,
      mimeType:  body.mimeType,
      size:      body.size,
      status:    'pending',
    })
    .returning()

  // ── 3. Generate presigned PUT URL (valid for 10 minutes) ───────────────
  const command = new PutObjectCommand({
    Bucket:      bucket,
    Key:         s3Key,
    ContentType: body.mimeType,
    ContentLength: body.size,
    // Metadata stored on the S3 object itself (visible in S3 console)
    Metadata: {
      'upload-id': upload.id,
      'user-id':   session.userId,
      'file-name': encodeURIComponent(body.fileName),
    },
  })

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 600 })

  // ── 4. Return URL + upload ID to client ────────────────────────────────
  return {
    uploadId:    upload.id,
    presignedUrl,
    s3Key,
    expiresIn:   600,
  }
})