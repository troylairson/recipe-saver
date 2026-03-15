import { createClient } from '@libsql/client'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dir, '../server/db/migrations')

const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN
const client = createClient({ url, authToken })

const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  try {
    await client.executeMultiple(sql)
    console.log('✓', file)
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('~', file, '(already applied)')
    } else {
      console.error('✗', file, '—', err.message)
      process.exit(1)
    }
  }
}

console.log('\nMigration complete.')
