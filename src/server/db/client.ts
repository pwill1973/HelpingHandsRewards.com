import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

/**
 * Database client factory
 * Abstraction layer to make it easier to migrate to PostgreSQL in the future
 */
export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type DbClient = ReturnType<typeof createDbClient>
