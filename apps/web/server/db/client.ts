/**
 * server/db/client.ts
 *
 * Single Drizzle + pg Pool instance for the Nitro server.
 * Import `db` anywhere inside server/ to run queries.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool }    from 'pg'
import * as schema from './schema/index.ts'
import { useEnv }  from '../utils/env'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db

  const { DATABASE_URL } = useEnv()

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 5_000,
  })

  pool.on('error', (err) => {
    console.error('[db] idle client error:', err.message)
  })

  _db = drizzle(pool, { schema })
  return _db
}