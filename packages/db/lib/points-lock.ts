import type { PrismaClient } from '../generated/prisma/client'

export const withPointsLock = async <T>(
  tx: Pick<PrismaClient, '$executeRawUnsafe'>,
  customerId: string,
  fn: () => Promise<T>,
): Promise<T> => {
  await tx.$executeRawUnsafe(
    `select pg_advisory_xact_lock(hashtext($1))`,
    `points:${customerId}`,
  )
  return fn()
}
