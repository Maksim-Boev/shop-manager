'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import {
  createTransferImpl,
  completeTransferImpl,
  cancelTransferImpl,
} from '@pkg/db'
import type { AuthUser } from '@pkg/db'

const CreateSchema = z.object({
  sourceStoreId: z.string().cuid(),
  destinationStoreId: z.string().cuid(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.coerce.number().positive(),
  })).min(1),
})

const IdSchema = z.object({ transferId: z.string().cuid() })

const requireAdminSession = async (): Promise<AuthUser> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }
  return session.user
}

export const createTransfer = async (
  input: unknown,
): Promise<{ id: string }> => {
  const actor = await requireAdminSession()
  const data = CreateSchema.parse(input)
  const result = await createTransferImpl(actor, data)
  revalidatePath('/transfers')
  return result
}

export const completeTransfer = async (input: unknown): Promise<void> => {
  const actor = await requireAdminSession()
  const data = IdSchema.parse(input)
  await completeTransferImpl(actor, data)
  revalidatePath('/transfers')
}

export const cancelTransfer = async (input: unknown): Promise<void> => {
  const actor = await requireAdminSession()
  const data = IdSchema.parse(input)
  await cancelTransferImpl(actor, data)
  revalidatePath('/transfers')
}
