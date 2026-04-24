import path from 'node:path'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  console.log('Running migrations...')

  const sql = postgres(url, {
    max: 1,
    ssl: url.includes('neon.tech') ? 'require' : false,
  })

  try {
    const db = drizzle(sql)

    await migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
    })

    console.log('Migrations done')
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
