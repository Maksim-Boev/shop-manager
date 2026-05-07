import { prisma } from '../prisma'
import type { UserRole, UserStatus } from '@/generated/prisma/enums'

export interface IStaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  status: UserStatus
  managedStores: { id: string; name: string }[]
  hasOpenShift: boolean
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
  const openShifts = userIds.length > 0
    ? await prisma.shift.findMany({
        where: { companyId, status: 'OPEN', cashierUserId: { in: userIds } },
        select: { cashierUserId: true },
        distinct: ['cashierUserId'],
      })
    : []
  const openSet = new Set(openShifts.map(s => s.cashierUserId))

  return users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    status: u.status,
    managedStores: u.managedStores.map(m => m.store),
    hasOpenShift: openSet.has(u.id),
  }))
}
