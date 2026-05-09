import { prisma } from '../prisma'
import type {
  UserRole, UserStatus, SalaryRatePeriod, SalaryPayoutStatus,
} from '@/generated/prisma/enums'

export interface IStaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  status: UserStatus
  managedStores: { id: string; name: string }[]
  hasOpenShift: boolean
  openShiftStart: Date | null
  scheduledShiftToday: { startsAt: Date; endsAt: Date } | null
}

export interface ICurrentSalaryRate {
  id: string
  ratePeriod: SalaryRatePeriod
  rateAmount: number
  salesPercent: number
  effectiveFrom: Date
}

export interface ISalaryPayoutRow {
  id: string
  periodYear: number
  periodMonth: number
  totalAmount: number
  status: SalaryPayoutStatus
  paidAt: Date | null
}

export interface IStaffMemberDetail extends IStaffMember {
  currentSalaryRate: ICurrentSalaryRate | null
  recentPayouts: ISalaryPayoutRow[]
}

export const getStaffList = async (companyId: string): Promise<IStaffMember[]> => {
  const users = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ['ADMIN', 'MANAGER', 'CASHIER'] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      managedStores: {
        select: { store: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
  })

  const userIds = users.map(u => u.id)
  if (userIds.length === 0) return []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [openShifts, scheduledShifts] = await Promise.all([
    prisma.shift.findMany({
      where: { companyId, status: 'OPEN', cashierUserId: { in: userIds } },
      select: { cashierUserId: true, openedAt: true },
      distinct: ['cashierUserId'],
    }),
    prisma.scheduledShift.findMany({
      where: {
        companyId,
        userId: { in: userIds },
        startsAt: { gte: todayStart, lt: tomorrowStart },
      },
      select: { userId: true, startsAt: true, endsAt: true },
    }),
  ])

  const openMap = new Map(openShifts.map(s => [s.cashierUserId, s.openedAt]))
  const schedMap = new Map(scheduledShifts.map(s => [s.userId, { startsAt: s.startsAt, endsAt: s.endsAt }]))

  return users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    status: u.status,
    managedStores: u.managedStores.map(m => m.store),
    hasOpenShift: openMap.has(u.id),
    openShiftStart: openMap.get(u.id) ?? null,
    scheduledShiftToday: schedMap.get(u.id) ?? null,
  }))
}

export const getStaffMemberDetail = async (
  userId: string,
  companyId: string,
): Promise<IStaffMemberDetail | null> => {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      managedStores: {
        select: { store: { select: { id: true, name: true } } },
      },
    },
  })
  if (!user) return null

  const [openShift, currentRate, recentPayouts] = await Promise.all([
    prisma.shift.findFirst({
      where: { companyId, status: 'OPEN', cashierUserId: userId },
      select: { openedAt: true },
      orderBy: { openedAt: 'desc' },
    }),
    prisma.userSalaryRate.findFirst({
      where: { userId, effectiveTo: null },
      select: {
        id: true,
        ratePeriod: true,
        rateAmount: true,
        salesPercent: true,
        effectiveFrom: true,
      },
    }),
    prisma.salaryPayout.findMany({
      where: { userId },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      take: 12,
      select: {
        id: true,
        periodYear: true,
        periodMonth: true,
        totalAmount: true,
        status: true,
        paidAt: true,
      },
    }),
  ])

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    managedStores: user.managedStores.map(m => m.store),
    hasOpenShift: !!openShift,
    openShiftStart: openShift?.openedAt ?? null,
    currentSalaryRate: currentRate
      ? {
          id: currentRate.id,
          ratePeriod: currentRate.ratePeriod,
          rateAmount: Number(currentRate.rateAmount),
          salesPercent: Number(currentRate.salesPercent),
          effectiveFrom: currentRate.effectiveFrom,
        }
      : null,
    recentPayouts: recentPayouts.map(p => ({
      id: p.id,
      periodYear: p.periodYear,
      periodMonth: p.periodMonth,
      totalAmount: Number(p.totalAmount),
      status: p.status,
      paidAt: p.paidAt,
    })),
  }
}
