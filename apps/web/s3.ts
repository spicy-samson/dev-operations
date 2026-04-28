/**
 * server/utils/s3.ts
 *
 * S3 client singleton. On EC2 the instance role handles credentials
 * automatically — no keys needed in production. For local dev, set
 * AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in .env.
 */
import { S3Client } from '@aws-sdk/client-s3'

let _s3: S3Client | null = null

export function useS3() {
  if (_s3) return _s3

  const config = useRuntimeConfig()

  _s3 = new S3Client({
    region: config.awsRegion || 'ap-southeast-1',
    // Credentials are auto-detected from the EC2 instance role in production.
    // In local dev, the SDK picks them up from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.
  })

  return _s3
}

export function useS3Bucket() {
  const config = useRuntimeConfig()
  if (!config.s3Bucket) throw new Error('S3_BUCKET is not set.')
  return config.s3Bucket
}
