/**
 * server/plugins/env.ts
 *
 * Nitro server plugin — runs once when the server starts.
 * Validates env immediately so a misconfigured deploy fails fast
 * instead of crashing on the first real request.
 */
import { useEnv } from '../utils/env'
import { defineNitroPlugin } from 'nitropack/plugin'

export default defineNitroPlugin(() => {
  try {
    const env = useEnv()
    console.log(`✅  Env validated — ${env.NODE_ENV} / ${env.APP_URL}`)
  } catch (err) {
    // Log clearly and exit — don't let the server limp along misconfigured
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
})