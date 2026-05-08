import { prisma } from '../lib/prisma'

const main = async () => {
  const result = await prisma.$executeRaw`
    UPDATE "Product"
    SET "costPrice" = ROUND(("basePrice" * (0.55 + RANDOM() * 0.25))::numeric, 2)
    WHERE "costPrice" IS NULL
  `
  console.log(`Backfill: оновлено ${result} продуктів`)
}

main().finally(() => prisma.$disconnect())
