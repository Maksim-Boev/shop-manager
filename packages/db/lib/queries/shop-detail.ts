import { prisma } from '../prisma'
import type { UserRole } from '../auth'
import type { ProductUnit } from '@/generated/prisma/enums'

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface ILowStockItem {
  productId: string
  sku: string
  name: string
  category: string
  unit: ProductUnit
  stock: number
}

export interface IShiftMember {
  userId: string
  firstName: string
  lastName: string
}

export interface IShopOverview {
  revenueToday: number
  revenueYesterday: number
  checksToday: number
  avgCheck: number
  staffOnShift: number
  outOfStockCount: number
  lowStockCount: number
  topLowStock: ILowStockItem[]
  staffOnShiftList: IShiftMember[]
}

export interface IStoreProductRow {
  productId: string
  sku: string
  name: string
  category: string
  unit: ProductUnit
  stock: number
  effectivePrice: number
  isAvailable: boolean
}

export interface IShopStaffMember {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  hasOpenShift: boolean
}

export interface IAvailableUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

export interface IClosedShift {
  id: string
  cashierFirstName: string
  cashierLastName: string
  openedAt: Date
  closedAt: Date
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  variance: number | null
  hasZReport: boolean
}

export interface IShopFinance {
  revenueByDay: { date: string; revenue: number }[]
  closedShifts: IClosedShift[]
}

export interface IScheduledShiftRow {
  id: string
  userId: string
  firstName: string
  lastName: string
  role: UserRole
  startsAtIso: string
  endsAtIso: string
  notes: string | null
}

export interface IStoreUserOption {
  id: string
  firstName: string
  lastName: string
  role: UserRole
}

// ── getShopOverview ─────────────────────────────────────────────────────────

export const getShopOverview = async (
  shopId: string,
  companyId: string,
): Promise<IShopOverview> => {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10)

  const [revToday, revYesterday, outOfStock, lowStock, openShifts, topLowStockItems] =
    await Promise.all([
      prisma.$queryRaw<{ revenue: unknown; checks: unknown }[]>`
        SELECT COALESCE(SUM("grandTotal"), 0) AS revenue, COUNT(*) AS checks
        FROM "Order"
        WHERE "storeId" = ${shopId} AND "companyId" = ${companyId}
          AND state = 'PAID' AND "paidAt"::date = ${todayStr}::date
      `,
      prisma.$queryRaw<{ revenue: unknown }[]>`
        SELECT COALESCE(SUM("grandTotal"), 0) AS revenue
        FROM "Order"
        WHERE "storeId" = ${shopId} AND "companyId" = ${companyId}
          AND state = 'PAID' AND "paidAt"::date = ${yesterdayStr}::date
      `,
      prisma.storeProduct.count({
        where: { storeId: shopId, store: { companyId }, stock: 0 },
      }),
      prisma.storeProduct.count({
        where: { storeId: shopId, store: { companyId }, stock: { gt: 0, lt: 10 } },
      }),
      prisma.shift.findMany({
        where: { storeId: shopId, companyId, status: 'OPEN' },
        select: { cashierUserId: true },
      }),
      prisma.storeProduct.findMany({
        where: { storeId: shopId, store: { companyId }, stock: { lt: 10 } },
        select: {
          stock: true,
          product: {
            select: {
              id: true, sku: true, name: true, unit: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { stock: 'asc' },
        take: 6,
      }),
    ])

  const revenueToday = Number(revToday[0]?.revenue ?? 0)
  const checksToday = Number(revToday[0]?.checks ?? 0)
  const revenueYesterday = Number(revYesterday[0]?.revenue ?? 0)
  const avgCheck = checksToday > 0 ? revenueToday / checksToday : 0

  const cashierIds = openShifts.map(s => s.cashierUserId)
  const cashiers =
    cashierIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: cashierIds }, companyId },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
  const cashierMap = new Map(cashiers.map(u => [u.id, u]))

  return {
    revenueToday,
    revenueYesterday,
    checksToday,
    avgCheck,
    staffOnShift: openShifts.length,
    outOfStockCount: outOfStock,
    lowStockCount: lowStock,
    topLowStock: topLowStockItems.map(sp => ({
      productId: sp.product.id,
      sku: sp.product.sku,
      name: sp.product.name,
      category: sp.product.category.name,
      unit: sp.product.unit,
      stock: Number(sp.stock),
    })),
    staffOnShiftList: openShifts
      .map(s => {
        const u = cashierMap.get(s.cashierUserId)
        if (!u) return null
        return { userId: u.id, firstName: u.firstName, lastName: u.lastName }
      })
      .filter((x): x is IShiftMember => x !== null),
  }
}

// ── getShopStock ────────────────────────────────────────────────────────────

export const getShopStock = async (
  shopId: string,
  companyId: string,
): Promise<IStoreProductRow[]> => {
  const items = await prisma.storeProduct.findMany({
    where: { storeId: shopId, store: { companyId } },
    select: {
      isAvailable: true,
      priceOverride: true,
      stock: true,
      product: {
        select: {
          id: true, sku: true, name: true, unit: true, basePrice: true,
          category: { select: { name: true } },
        },
      },
    },
  })

  return items
    .sort((a, b) => {
      const aS = Number(a.stock)
      const bS = Number(b.stock)
      const ap = aS === 0 ? 0 : aS < 10 ? 1 : 2
      const bp = bS === 0 ? 0 : bS < 10 ? 1 : 2
      if (ap !== bp) return ap - bp
      return a.product.name.localeCompare(b.product.name, 'uk')
    })
    .map(sp => ({
      productId: sp.product.id,
      sku: sp.product.sku,
      name: sp.product.name,
      category: sp.product.category.name,
      unit: sp.product.unit,
      stock: Number(sp.stock),
      effectivePrice: Number(sp.priceOverride ?? sp.product.basePrice),
      isAvailable: sp.isAvailable,
    }))
}

// ── getShopStaff ────────────────────────────────────────────────────────────

export const getShopStaff = async (
  shopId: string,
  companyId: string,
): Promise<IShopStaffMember[]> => {
  const assignments = await prisma.managerStore.findMany({
    where: { storeId: shopId, user: { companyId } },
    select: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  })

  const userIds = assignments.map(a => a.user.id)
  const openShifts =
    userIds.length > 0
      ? await prisma.shift.findMany({
          where: { storeId: shopId, cashierUserId: { in: userIds }, status: 'OPEN' },
          select: { cashierUserId: true },
        })
      : []
  const onShiftIds = new Set(openShifts.map(s => s.cashierUserId))

  return assignments.map(a => ({
    userId: a.user.id,
    firstName: a.user.firstName,
    lastName: a.user.lastName,
    email: a.user.email,
    role: a.user.role,
    hasOpenShift: onShiftIds.has(a.user.id),
  }))
}

// ── getAvailableStaffForShop ────────────────────────────────────────────────

export const getAvailableStaffForShop = async (
  shopId: string,
  companyId: string,
): Promise<IAvailableUser[]> => {
  const assigned = await prisma.managerStore.findMany({
    where: { storeId: shopId },
    select: { userId: true },
  })
  const excludeIds = assigned.map(a => a.userId)

  return prisma.user.findMany({
    where: {
      companyId,
      role: { in: ['MANAGER', 'ADMIN'] },
      status: 'ACTIVE',
      ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })
}

// ── getShopFinance ──────────────────────────────────────────────────────────

export const getShopFinance = async (
  shopId: string,
  companyId: string,
  range: 'week' | 'month',
): Promise<IShopFinance> => {
  const days = range === 'week' ? 7 : 30
  const fromStr = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const [revenueRows, closedShifts] = await Promise.all([
    prisma.$queryRaw<{ date: string; revenue: unknown }[]>`
      SELECT "paidAt"::date::text AS date, COALESCE(SUM("grandTotal"), 0) AS revenue
      FROM "Order"
      WHERE "storeId" = ${shopId} AND "companyId" = ${companyId}
        AND state = 'PAID' AND "paidAt"::date >= ${fromStr}::date
      GROUP BY "paidAt"::date
      ORDER BY date
    `,
    prisma.shift.findMany({
      where: { storeId: shopId, companyId, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      take: 30,
      select: {
        id: true, cashierUserId: true, openedAt: true, closedAt: true,
        openingCash: true, closingCash: true, expectedCash: true, variance: true,
        reports: { select: { type: true } },
      },
    }),
  ])

  const userIds = [...new Set(closedShifts.map(s => s.cashierUserId))]
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds }, companyId },
          select: { id: true, firstName: true, lastName: true },
        })
      : []
  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    revenueByDay: revenueRows.map(r => ({ date: r.date, revenue: Number(r.revenue) })),
    closedShifts: closedShifts.map(s => {
      const u = userMap.get(s.cashierUserId)
      return {
        id: s.id,
        cashierFirstName: u?.firstName ?? '—',
        cashierLastName: u?.lastName ?? '—',
        openedAt: s.openedAt,
        closedAt: s.closedAt!,
        openingCash: Number(s.openingCash),
        closingCash: s.closingCash !== null ? Number(s.closingCash) : null,
        expectedCash: s.expectedCash !== null ? Number(s.expectedCash) : null,
        variance: s.variance !== null ? Number(s.variance) : null,
        hasZReport: s.reports.some(r => r.type === 'Z'),
      }
    }),
  }
}

// ── getShopSchedule ─────────────────────────────────────────────────────────

export const getShopSchedule = async (
  shopId: string,
  companyId: string,
  weekStart: Date,
): Promise<IScheduledShiftRow[]> => {
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)

  const rows = await prisma.scheduledShift.findMany({
    where: {
      companyId,
      storeId: shopId,
      startsAt: { gte: weekStart, lt: weekEnd },
    },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      userId: true,
      startsAt: true,
      endsAt: true,
      notes: true,
      user: {
        select: { firstName: true, lastName: true, role: true },
      },
    },
  })

  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    role: r.user.role,
    startsAtIso: r.startsAt.toISOString(),
    endsAtIso: r.endsAt.toISOString(),
    notes: r.notes,
  }))
}

// ── getStoreUsersForScheduling ──────────────────────────────────────────────

export const getStoreUsersForScheduling = async (
  companyId: string,
): Promise<IStoreUserOption[]> => {
  return prisma.user.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })
}
