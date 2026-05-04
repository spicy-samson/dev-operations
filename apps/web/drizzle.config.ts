import { defineConfig } from 'drizzle-kit'
import { config }       from 'dotenv'

// drizzle-kit runs outside Nuxt so we load .env.local manually
config({ path: '.env.local', override: false })
config({ path: '.env',       override: false })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — check your .env.local')
}

export default defineConfig({
  dialect: 'postgresql',
  schema:  './server/db/schema/index.ts',
  out:     './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict:  true,
})