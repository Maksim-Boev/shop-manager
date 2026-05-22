'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { createManualAdjustmentImpl } from '@pkg/db'

const Schema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().refine(v => v !== 0, 'Кількість не може бути 0'),
  reason: z.string().min(3),
})

export const createManualAdjustment = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')

  const { role, companyId, id: userId } = session.user
  if (role !== 'MANAGER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const data = Schema.parse(input)

  await createManualAdjustmentImpl({
    companyId: companyId ?? '',
    storeId: data.storeId,
    productId: data.productId,
    quantity: data.quantity,
    reason: data.reason,
    userId,
  })

  revalidatePath('/shops/' + data.storeId)
}
