'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'
import type { TWeeklySchedule } from '@pkg/db'

const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Формат часу: HH:MM')

const DayEntrySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    from: TimeSchema.optional(),
    to: TimeSchema.optional(),
  })
  .refine(d => !d.isOpen || (!!d.from && !!d.to), {
    message: 'Для відкритого дня потрібен час від і до',
  })

const WeeklyScheduleSchema = z.object({
  days: z.array(DayEntrySchema).length(7),
})

const ExceptionInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата у форматі YYYY-MM-DD'),
    annual: z.boolean(),
    isOpen: z.boolean(),
    from: TimeSchema.optional(),
    to: TimeSchema.optional(),
    note: z.string().max(200).optional(),
  })
  .refine(d => !d.isOpen || (!!d.from && !!d.to), {
    message: 'Для відкритого виключення потрібен час від і до',
  })

const requireAdminAccess = async () => {
  const session = await auth()
  if (
    !session ||
    !(ALLOWED_ROLES as readonly string[]).includes(session.user.role) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }
  return session.user.companyId
}

const requireStoreAccess = async (shopId: string, companyId: string) => {
  const store = await prisma.store.findFirst({ where: { id: shopId, companyId } })
  if (!store) throw new Error('Магазин не знайдено')
}

// 'YYYY-MM-DD' → { year, month, day } у локальному календарі
// Не використовувати new Date(str) — парситься як UTC, на серверах західніше UTC дає неправильну дату
const parseIsoDate = (iso: string): { year: number; month: number; day: number } => {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

const revalidateShopPaths = (shopId: string): void => {
  revalidatePath(`/shops/${shopId}`)
  revalidatePath('/shops')
}

export const updateWeeklySchedule = async (shopId: string, schedule: unknown): Promise<void> => {
  const companyId = await requireAdminAccess()
  const parsed = WeeklyScheduleSchema.parse(schedule)
  await requireStoreAccess(shopId, companyId)

  await prisma.store.update({
    where: { id: shopId },
    data: { weeklySchedule: parsed as TWeeklySchedule },
  })

  revalidateShopPaths(shopId)
}

export const addScheduleException = async (shopId: string, input: unknown): Promise<void> => {
  const companyId = await requireAdminAccess()
  const data = ExceptionInputSchema.parse(input)
  await requireStoreAccess(shopId, companyId)

  const { year: y, month, day } = parseIsoDate(data.date)
  const year = data.annual ? null : y

  await prisma.storeScheduleException.create({
    data: {
      storeId: shopId,
      month,
      day,
      year,
      isOpen: data.isOpen,
      from: data.isOpen ? (data.from ?? null) : null,
      to: data.isOpen ? (data.to ?? null) : null,
      note: data.note ?? null,
    },
  })

  revalidateShopPaths(shopId)
}

export const updateScheduleException = async (
  exceptionId: string,
  shopId: string,
  input: unknown,
): Promise<void> => {
  const companyId = await requireAdminAccess()
  const data = ExceptionInputSchema.parse(input)

  const exc = await prisma.storeScheduleException.findFirst({
    where: { id: exceptionId, storeId: shopId, store: { companyId } },
  })
  if (!exc) throw new Error('Виключення не знайдено')

  const { year: y, month, day } = parseIsoDate(data.date)
  const year = data.annual ? null : y

  await prisma.storeScheduleException.update({
    where: { id: exceptionId },
    data: {
      month,
      day,
      year,
      isOpen: data.isOpen,
      from: data.isOpen ? (data.from ?? null) : null,
      to: data.isOpen ? (data.to ?? null) : null,
      note: data.note ?? null,
    },
  })

  revalidateShopPaths(shopId)
}

export const deleteScheduleException = async (exceptionId: string, shopId: string): Promise<void> => {
  const companyId = await requireAdminAccess()

  const exc = await prisma.storeScheduleException.findFirst({
    where: { id: exceptionId, storeId: shopId, store: { companyId } },
  })
  if (!exc) throw new Error('Виключення не знайдено')

  await prisma.storeScheduleException.delete({ where: { id: exceptionId } })
  revalidateShopPaths(shopId)
}
