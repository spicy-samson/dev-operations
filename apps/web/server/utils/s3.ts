/**
 * server/utils/s3.ts
 *
 * S3 client singleton.
 * On EC2 the instance IAM role provides credentials automatically.
 * Locally, the SDK picks up AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 * from .env.local.
 */
import { S3Client } from '@aws-sdk/client-s3'
import { useEnv }   from './env'

let _s3: S3Client | null = null

export function useS3(): S3Client {
  if (_s3) return _s3

  const { AWS_REGION } = useEnv()

  _s3 = new S3Client({ region: AWS_REGION })
  return _s3
}

export function useS3Bucket(): string {
  const { S3_BUCKET } = useEnv()
  return S3_BUCKET
}