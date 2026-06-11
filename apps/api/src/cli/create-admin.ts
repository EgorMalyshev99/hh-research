import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'

import { isPasswordStrong } from '@repo/shared'

import { users } from '../database/schema/users.js'

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--promote') {
      args.promote = true
      continue
    }
    if (arg?.startsWith('--') && argv[i + 1]) {
      args[arg.slice(2)] = argv[i + 1]!
      i++
    }
  }
  return args
}

const cliSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().max(100).refine(isPasswordStrong, { message: 'Пароль не соответствует требованиям' }),
})

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const raw = parseArgs(process.argv.slice(2))
  const promote = raw.promote === true
  const parsed = cliSchema.safeParse({
    email: raw.email,
    name: raw.name,
    password: raw.password,
  })
  if (!parsed.success) {
    console.error(parsed.error.flatten())
    process.exit(1)
  }

  const { email, name, password } = parsed.data

  const sql = postgres(url, {
    max: 1,
    ssl: url.includes('neon.tech') ? 'require' : false,
  })

  try {
    const db = drizzle(sql)
    const [existing] = await db.select().from(users).where(eq(users.email, email))

    if (existing) {
      if (!promote) {
        console.error('Пользователь уже существует. Используйте --promote для повышения до admin.')
        process.exit(1)
      }
      const [updated] = await db
        .update(users)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning()
      if (!updated) throw new Error('Не удалось обновить пользователя')
      console.log(JSON.stringify({ id: updated.id, email: updated.email, role: updated.role }))
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [created] = await db.insert(users).values({ email, name, passwordHash, role: 'admin' }).returning()
    if (!created) throw new Error('Не удалось создать пользователя')
    console.log(JSON.stringify({ id: created.id, email: created.email, role: created.role }))
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
