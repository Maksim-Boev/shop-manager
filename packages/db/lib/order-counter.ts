import type { PrismaClient } from '../generated/prisma/client'

export const getNextOrderNumber = async (
  tx: Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe'>,
  storeId: string,
): Promise<number> => {
  const rows = await tx.$queryRawUnsafe<{ nextNumber: number }[]>(
    `select "nextNumber" from "StoreOrderCounter" where "storeId" = $1 for update`,
    storeId,
  )
  if (rows.length === 0) {
    await tx.$executeRawUnsafe(
      `insert into "StoreOrderCounter" ("storeId", "nextNumber") values ($1, 2)`,
      storeId,
    )
    return 1
  }
  const current = rows[0].nextNumber
  await tx.$executeRawUnsafe(
    `update "StoreOrderCounter" set "nextNumber" = "nextNumber" + 1 where "storeId" = $1`,
    storeId,
  )
  return current
}
