import { prisma } from '../prisma'
import type { AuthUser } from '../auth'

export interface ICreateScheduledShiftsInput {
  shopId: string
  userIds: string[]
  startsAt: Date
  endsAt: Date
  notes?: string
  leaderUserId?: string
}

export const createScheduledShiftsImpl = async (
  actor: AuthUser,
  input: ICreateScheduledShiftsInput,
): Promise<{ ids: string[] }> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'MANAGER') {
    throw new Error('Недостатньо прав')
  }
  const companyId = actor.companyId ?? ''
  const { shopId, userIds, startsAt, endsAt, notes, leaderUserId } = input

  if (userIds.length === 0) throw new Error('Не вказано співробітників')
  if (endsAt <= startsAt) throw new Error('Кінець зміни має бути пізніше початку')

  if (leaderUserId && !userIds.includes(leaderUserId)) {
    throw new Error('Старший зміни має бути з обраних співробітників')
  }
  const effectiveLeader = leaderUserId ?? (userIds.length === 1 ? userIds[0] : undefined)

  const store = await prisma.store.findFirst({
    where: { id: shopId, companyId },
    select: { id: true },
  })
  if (!store) throw new Error('Магазин не знайдено')

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, companyId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (users.length !== userIds.length) throw new Error('Один зі співробітників не знайдений')

  if (actor.role === 'MANAGER') {
    const link = await prisma.managerStore.findFirst({
      where: { userId: actor.id, storeId: shopId },
      select: { userId: true },
    })
    if (!link) throw new Error('Магазин не закріплений за вами')
  }

  const created = await prisma.$transaction(async tx => {
    if (effectiveLeader) {
      await tx.scheduledShift.updateMany({
        where: {
          storeId: shopId,
          companyId,
          isShiftLeader: true,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        data: { isShiftLeader: false },
      })
    }

    const ids: string[] = []
    for (const userId of userIds) {
      const isLeader = userId === effectiveLeader
      const row = await tx.scheduledShift.create({
        data: {
          companyId, storeId: shopId, userId,
          startsAt, endsAt, notes: notes ?? null,
          isShiftLeader: isLeader,
          createdByUserId: actor.id,
        },
        select: { id: true },
      })
      ids.push(row.id)
    }
    return ids
  })

  return { ids: created }
}
