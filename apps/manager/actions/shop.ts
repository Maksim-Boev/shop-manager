'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'

const CreateShopSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова").max(255),
  address: z.string().max(500).optional(),
})

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
    },
    select: { id: true },
  })

  return { id: store.id }
}
