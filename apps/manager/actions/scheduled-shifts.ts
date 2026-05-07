'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

const ROLES_FULL: UserRole[] = ['SUPER_ADMIN', 'ADMIN']
const ROLES_ANY: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']

const IsoSchema = z.string().refine(
  v => !Number.isNaN(Date.parse(v)),
  { message: 'Невірний формат дати' },
)

const CreateSchema = z.object({
  shopId: z.string().min(1),
  userId: z.string().min(1),
  startsAt: IsoSchema,
  endsAt: IsoSchema,
  notes: z.string().max(500).optional(),
})

const UpdateSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  startsAt: IsoSchema,
  endsAt: IsoSchema,
  notes: z.string().max(500).optional(),
})

const requireScheduler = async (storeId: string) => {
  const session = await auth()
  if (!session?.user.companyId) throw new Error('Недостатньо прав')
  const role = session.user.role
  if (!ROLES_ANY.includes(role)) throw new Error('Недостатньо прав')

  const companyId = session.user.companyId
  const userId = session.user.id

  const store = await prisma.store.findFirst({
    where: { id: storeId, companyId },
    select: { id: true },
  })
  if (!store) throw new Error('Магазин не знайдено')

  if (!ROLES_FULL.includes(role)) {
    const link = await prisma.managerStore.findFirst({
      where: { userId, storeId, user: { companyId } },
      select: { userId: true },
    })
    if (!link) throw new Error('Магазин не закріплений за вами')
  }

  return { companyId, userId }
}

const assertNoOverlap = async (params: {
  userId: string
  startsAt: Date
  endsAt: Date
  excludeId?: string
}) => {
  const conflict = await prisma.scheduledShift.findFirst({
    where: {
      userId: params.userId,
      ...(params.excludeId && { NOT: { id: params.excludeId } }),
      startsAt: { lt: params.endsAt },
      endsAt: { gt: params.startsAt },
    },
    select: { id: true },
  })
  if (conflict) throw new Error('Зміна перетинається з іншою для цього співробітника')
}

const assertUserInCompany = async (userId: string, companyId: string) => {
  const u = await prisma.user.findFirst({
    where: { id: userId, companyId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (!u) throw new Error('Співробітника не знайдено')
}

export const createScheduledShift = async (input: unknown): Promise<{ id: string }> => {
  const data = CreateSchema.parse(input)
  const { companyId, userId: actorId } = await requireScheduler(data.shopId)

  const startsAt = new Date(data.startsAt)
  const endsAt = new Date(data.endsAt)
  if (endsAt <= startsAt) throw new Error('Кінець зміни має бути пізніше початку')

  await assertUserInCompany(data.userId, companyId)
  await assertNoOverlap({ userId: data.userId, startsAt, endsAt })

  const created = await prisma.scheduledShift.create({
    data: {
      companyId,
      storeId: data.shopId,
      userId: data.userId,
      startsAt,
      endsAt,
      notes: data.notes ?? null,
      createdByUserId: actorId,
    },
    select: { id: true },
  })

  revalidatePath(`/shops/${data.shopId}`)
  return { id: created.id }
}

export const updateScheduledShift = async (input: unknown): Promise<void> => {
  const data = UpdateSchema.parse(input)

  const existing = await prisma.scheduledShift.findFirst({
    where: { id: data.id },
    select: { storeId: true, companyId: true },
  })
  if (!existing) throw new Error('Зміну не знайдено')

  const { companyId } = await requireScheduler(existing.storeId)
  if (existing.companyId !== companyId) throw new Error('Недостатньо прав')

  const startsAt = new Date(data.startsAt)
  const endsAt = new Date(data.endsAt)
  if (endsAt <= startsAt) throw new Error('Кінець зміни має бути пізніше початку')

  await assertUserInCompany(data.userId, companyId)
  await assertNoOverlap({
    userId: data.userId, startsAt, endsAt, excludeId: data.id,
  })

  await prisma.scheduledShift.update({
    where: { id: data.id },
    data: {
      userId: data.userId,
      startsAt,
      endsAt,
      notes: data.notes ?? null,
    },
  })

  revalidatePath(`/shops/${existing.storeId}`)
}

export const deleteScheduledShift = async (id: string): Promise<void> => {
  const parsed = z.string().min(1).parse(id)

  const existing = await prisma.scheduledShift.findFirst({
    where: { id: parsed },
    select: { storeId: true, companyId: true },
  })
  if (!existing) throw new Error('Зміну не знайдено')

  const { companyId } = await requireScheduler(existing.storeId)
  if (existing.companyId !== companyId) throw new Error('Недостатньо прав')

  await prisma.scheduledShift.delete({ where: { id: parsed } })
  revalidatePath(`/shops/${existing.storeId}`)
}
