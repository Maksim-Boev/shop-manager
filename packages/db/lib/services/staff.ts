import { prisma } from '../prisma'
import { hashPassword } from '../auth'
import type { AuthUser } from '../auth'
import type { UserStatus, SalaryRatePeriod, UserRole } from '@/generated/prisma/enums'

export interface ISetUserStatusInput {
  userId: string
  status: UserStatus
}

export interface ISetUserSalaryInput {
  userId: string
  ratePeriod: SalaryRatePeriod
  rateAmount: number
  salesPercent: number
}

export interface ISetStoreAssignmentInput {
  userId: string
  storeIds: string[]
}

export interface ICreateStaffMemberInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  storeIds: string[]
}

export const setUserStatusImpl = async (
  actor: AuthUser,
  input: ISetUserStatusInput,
): Promise<void> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { userId, status } = input

  if (userId === actor.id) {
    throw new Error('Не можна змінити власний статус')
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId: actor.companyId ?? '' },
    select: { id: true, role: true, status: true },
  })
  if (!target) throw new Error('Користувача не знайдено')

  if (target.role === 'SUPER_ADMIN') {
    throw new Error('Не можна змінити статус Супер-адміна')
  }
  if (target.role === 'ADMIN' && actor.role === 'ADMIN') {
    throw new Error('Адмін не може змінити статус іншого адміна')
  }

  if (target.status === status) return

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  })
}

export const setUserSalaryImpl = async (
  actor: AuthUser,
  input: ISetUserSalaryInput,
): Promise<void> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { userId, ratePeriod, rateAmount, salesPercent } = input

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId: actor.companyId ?? '' },
    select: { id: true, role: true },
  })
  if (!target) throw new Error('Користувача не знайдено')
  if (target.role === 'SUPER_ADMIN') throw new Error('Не можна встановити ставку Супер-адміну')

  const now = new Date()

  await prisma.$transaction([
    prisma.userSalaryRate.updateMany({
      where: { userId, effectiveTo: null },
      data: { effectiveTo: now },
    }),
    prisma.userSalaryRate.create({
      data: {
        companyId: actor.companyId ?? '',
        userId,
        ratePeriod,
        rateAmount,
        salesPercent,
        effectiveFrom: now,
        createdByUserId: actor.id,
      },
    }),
  ])
}

export const setStoreAssignmentImpl = async (
  actor: AuthUser,
  input: ISetStoreAssignmentInput,
): Promise<void> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { userId, storeIds } = input
  const companyId = actor.companyId ?? ''

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId },
    select: { id: true, role: true },
  })
  if (!target) throw new Error('Користувача не знайдено')
  if (target.role === 'SUPER_ADMIN') throw new Error('Не можна змінити призначення Супер-адміну')

  if (storeIds.length > 0) {
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds }, companyId },
      select: { id: true },
    })
    if (stores.length !== storeIds.length) throw new Error('Один з магазинів не знайдено')
  }

  await prisma.$transaction([
    prisma.managerStore.deleteMany({ where: { userId } }),
    ...(storeIds.length > 0
      ? [prisma.managerStore.createMany({
          data: storeIds.map(storeId => ({ userId, storeId })),
        })]
      : []),
  ])
}

export const createStaffMemberImpl = async (
  actor: AuthUser,
  input: ICreateStaffMemberInput,
): Promise<{ id: string }> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { firstName, lastName, email, password, role, storeIds } = input
  const companyId = actor.companyId ?? ''

  if (role === 'SUPER_ADMIN') throw new Error('Не можна створити Супер-адміна')
  if (actor.role === 'ADMIN' && role === 'ADMIN') {
    throw new Error('Адмін не може створити іншого адміна')
  }

  if (storeIds.length > 0) {
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds }, companyId },
      select: { id: true },
    })
    if (stores.length !== storeIds.length) throw new Error('Магазин не знайдено')
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.$transaction(async tx => {
    const u = await tx.user.create({
      data: { companyId, email, passwordHash, firstName, lastName, role },
      select: { id: true },
    })
    if (storeIds.length > 0) {
      await tx.managerStore.createMany({
        data: storeIds.map(storeId => ({ userId: u.id, storeId })),
      })
    }
    return u
  })

  return { id: user.id }
}

export const deleteStaffMemberImpl = async (
  actor: AuthUser,
  input: { userId: string },
): Promise<void> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { userId } = input

  if (userId === actor.id) throw new Error('Не можна видалити власний акаунт')

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId: actor.companyId ?? '' },
    select: { id: true, role: true },
  })
  if (!target) throw new Error('Користувача не знайдено')

  if (target.role === 'SUPER_ADMIN') throw new Error('Не можна видалити Супер-адміна')
  if (target.role === 'ADMIN' && actor.role === 'ADMIN') {
    throw new Error('Адмін не може видалити іншого адміна')
  }

  const openShift = await prisma.shift.findFirst({
    where: { cashierUserId: userId, status: 'OPEN' },
    select: { id: true },
  })
  if (openShift) throw new Error('Не можна видалити співробітника з відкритою зміною')

  await prisma.user.delete({ where: { id: userId } })
}
