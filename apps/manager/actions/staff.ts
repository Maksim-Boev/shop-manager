'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { setUserStatusImpl } from '@pkg/db'

const SetStatusSchema = z.object({
  userId: z.string().cuid(),
  status: z.enum(['ACTIVE', 'BLOCKED']),
})

export const setUserStatus = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')

  const parsed = SetStatusSchema.parse(input)
  await setUserStatusImpl(session.user, parsed)
  revalidatePath('/staff')
}
