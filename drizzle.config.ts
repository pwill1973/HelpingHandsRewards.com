import type { Config } from 'drizzle-kit'

export default {
  schema: './src/server/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: 'placeholder',
    databaseId: 'placeholder',
    token: 'placeholder'
  }
} satisfies Config
