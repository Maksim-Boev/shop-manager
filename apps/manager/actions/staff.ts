'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import {
  setUserStatusImpl,
  setUserSalaryImpl,
  setStoreAssignmentImpl,
  createStaffMemberImpl,
  deleteStaffMemberImpl,
} from '@pkg/db'

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

const SetSalarySchema = z.object({
  userId: z.string().cuid(),
  ratePeriod: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
  rateAmount: z.number().min(0),
  salesPercent: z.number().min(0).max(100).default(0),
})

export const setUserSalary = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')

  const parsed = SetSalarySchema.parse(input)
  await setUserSalaryImpl(session.user, parsed)
  revalidatePath(`/staff/${parsed.userId}`)
  revalidatePath('/staff')
}

const SetStoreAssignmentSchema = z.object({
  userId: z.string().cuid(),
  storeIds: z.array(z.string().cuid()),
})

export const setStoreAssignment = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')

  const parsed = SetStoreAssignmentSchema.parse(input)
  await setStoreAssignmentImpl(session.user, parsed)
  revalidatePath(`/staff/${parsed.userId}`)
  revalidatePath('/staff')
}

const CreateStaffSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'SALESPERSON']),
  storeIds: z.array(z.string().cuid()).default([]),
})

export const createStaffMember = async (
  input: unknown,
): Promise<{ id: string } | { error: string }> => {
  const session = await auth()
  if (!session) return { error: 'Не авторизовано' }

  const parsed = CreateStaffSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Невірні дані' }

  try {
    const result = await createStaffMemberImpl(session.user, parsed.data)
    revalidatePath('/staff')
    return result
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Помилка створення' }
  }
}

const DeleteStaffSchema = z.object({
  userId: z.string().cuid(),
})

export const deleteStaffMember = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (!session) throw new Error('Не авторизовано')

  const { userId } = DeleteStaffSchema.parse(input)
  await deleteStaffMemberImpl(session.user, { userId })
  revalidatePath('/staff')
  redirect('/staff')
}
