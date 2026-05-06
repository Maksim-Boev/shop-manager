'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'

const CreateShopSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова").max(255),
  address: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  openingHours: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  area: z.coerce.number().int().positive().optional(),
})

const ArchiveShopSchema = z.object({ shopId: z.string() })
const ManagerSchema = z.object({ shopId: z.string(), userId: z.string() })

export const createShop = async (input: unknown): Promise<{ id: string }> => {
  const session = await auth()
  if (
    !session ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = CreateShopSchema.parse(input)

  const store = await prisma.store.create({
    data: {
      companyId: session.user.companyId,
      type: 'SHOP',
      name: data.name,
      address: data.address ?? null,
      region: data.region ?? null,
      openingHours: data.openingHours ?? null,
      phone: data.phone ?? null,
      area: data.area ?? null,
    },
    select: { id: true },
  })

  return { id: store.id }
}

export const archiveShop = async (shopId: string): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = ArchiveShopSchema.parse({ shopId })
  const companyId = session.user.companyId

  const store = await prisma.store.findFirst({
    where: { id: data.shopId, companyId },
  })
  if (!store) throw new Error('Магазин не знайдено')

  await prisma.store.update({
    where: { id: data.shopId },
    data: { status: 'ARCHIVED' },
  })

  revalidatePath('/shops')
  revalidatePath(`/shops/${data.shopId}`)
}

export const assignManager = async (shopId: string, userId: string): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = ManagerSchema.parse({ shopId, userId })
  const companyId = session.user.companyId

  const [store, user] = await Promise.all([
    prisma.store.findFirst({ where: { id: data.shopId, companyId } }),
    prisma.user.findFirst({ where: { id: data.userId, companyId } }),
  ])
  if (!store) throw new Error('Магазин не знайдено')
  if (!user) throw new Error('Користувача не знайдено')

  await prisma.managerStore.upsert({
    where: { userId_storeId: { userId: data.userId, storeId: data.shopId } },
    create: { userId: data.userId, storeId: data.shopId },
    update: {},
  })

  revalidatePath(`/shops/${data.shopId}`)
}

export const removeManager = async (shopId: string, userId: string): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = ManagerSchema.parse({ shopId, userId })
  const companyId = session.user.companyId

  const store = await prisma.store.findFirst({ where: { id: data.shopId, companyId } })
  if (!store) throw new Error('Магазин не знайдено')

  await prisma.managerStore.delete({
    where: { userId_storeId: { userId: data.userId, storeId: data.shopId } },
  })

  revalidatePath(`/shops/${data.shopId}`)
}
