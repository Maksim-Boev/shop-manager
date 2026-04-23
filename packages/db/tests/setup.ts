import { execSync } from 'node:child_process'
import { beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

beforeAll(() => {
  execSync('pnpm exec prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  })
})

beforeEach(async () => {
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> '_prisma_migrations'`,
  )
  if (tables.length === 0) return
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`truncate ${list} restart identity cascade`)
})

afterAll(async () => {
  await prisma.$disconnect()
})
