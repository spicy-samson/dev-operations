/**
 * server/tasks/db/migrate.ts
 *
 * Nitro task — runs all pending Drizzle migrations against the database.
 *
 * Run locally:
 *   pnpm db:migrate
 *
 * Run on EC2 (one-liner after deploy):
 *   docker compose exec app node -e "
 *     import('.output/server/chunks/tasks/db/migrate.mjs').then(m => m.default.run({},{payload:{}}))
 *   "
 *
 * Or just use the drizzle-kit CLI locally and run the SQL against RDS via tunnel.
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { useDb }   from '~/server/db/client'
import path        from 'node:path'

export default defineTask({
  meta: {
    name:        'db:migrate',
    description: 'Run all pending Drizzle migrations',
  },
  async run() {
    console.log('[db:migrate] running migrations…')
    const db = useDb()

    await migrate(db, {
      migrationsFolder: path.resolve('./server/db/migrations'),
    })

    console.log('[db:migrate] ✅ done')
    return { result: 'ok' }
  },
})