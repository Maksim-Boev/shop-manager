import { afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

// Тестовой БД нет — всё работает на DATABASE_URL (dev-БД). Миграции применяет пользователь,
// поэтому `prisma migrate reset` здесь не вызываем (он бы стёр dev-данные).
// Стратегия изоляции между тестами будет добавлена отдельно, когда перейдём к этапу тестов.

afterAll(async () => {
  await prisma.$disconnect()
})
