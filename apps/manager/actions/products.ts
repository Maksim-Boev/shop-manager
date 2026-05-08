'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'

const UpdateProductSchema = z.object({
  productId: z.string().min(1),
  basePrice: z.coerce.number().nonnegative(),
  costPrice: z.union([z.coerce.number().nonnegative(), z.null()]),
})

export const updateProduct = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = UpdateProductSchema.parse(input)

  const product = await prisma.product.findFirst({
    where: { id: data.productId, companyId: session.user.companyId },
    select: { id: true },
  })
  if (!product) throw new Error('Товар не знайдений')

  await prisma.product.update({
    where: { id: data.productId },
    data: {
      basePrice: data.basePrice.toFixed(2),
      costPrice: data.costPrice === null ? null : data.costPrice.toFixed(2),
    },
  })

  revalidatePath('/shops/[shopId]', 'page')
  revalidatePath('/shops')
}
