/**
 * server/utils/env.ts
 *
 * Validates all required environment variables at server startup.
 * If anything is missing or malformed, the app crashes immediately
 * with a clear error — no silent failures at runtime.
 *
 * Usage (in any server/ file):
 *   import { useEnv } from '~/server/utils/env'
 *   const env = useEnv()
 *   env.DATABASE_URL  // fully typed
 */
import { z } from 'zod'

const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .startsWith('postgres', 'DATABASE_URL must be a postgres:// or postgresql:// connection string'),

  // ── Auth ──────────────────────────────────────────────────────────────────
  NUXT_SESSION_SECRET: z
    .string()
    .min(32, 'NUXT_SESSION_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32'),

  // ── AWS ───────────────────────────────────────────────────────────────────
  AWS_REGION: z
    .string()
    .default('ap-southeast-1'),

  S3_BUCKET: z
    .string()
    .min(1, 'S3_BUCKET is required'),

  // AWS credentials are optional at validation time:
  // On EC2, the instance role provides them automatically.
  // Locally, you set them in .env.local.
  AWS_ACCESS_KEY_ID:     z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // ── App ───────────────────────────────────────────────────────────────────
  APP_NAME: z.string().default('MyApp'),
  APP_URL:  z.string().url().default('http://localhost:3000'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function useEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    // Crash hard — a misconfigured app should never silently start
    throw new Error(
      `\n\n❌  Missing or invalid environment variables:\n${errors}\n\n` +
      `Copy .env.example → .env.local and fill in the values.\n`
    )
  }

  _env = result.data
  return _env
}