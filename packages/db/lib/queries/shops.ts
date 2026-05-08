import { prisma } from '../prisma'
import type { TWeeklySchedule, IScheduleException } from '../utils/shop-status'

export interface IShopWithStats {
  id: string
  name: string
  address: string | null
  region: string | null
  weeklySchedule: TWeeklySchedule | null
  scheduleExceptions: IScheduleException[]
  status: 'ACTIVE' | 'ARCHIVED'
  revenueToday: number
  realizedMarginToday: number | null
  realizedMarginPctToday: number | null
  stockTotal: number
  outOfStockCount: number
  lowStockCount: number
  managersCount: number
  hasOpenShift: boolean
}

export const getShopsWithStats = async (companyId: string): Promise<IShopWithStats[]> => {
  const today = new Date().toISOString().slice(0, 10)

  const [stores, revenueRows, costRows, stockAgg, outOfStock, lowStock, openShifts] =
    await Promise.all([
      prisma.store.findMany({
        where: { companyId, type: 'SHOP' },
        select: {
          id: true,
          name: true,
          address: true,
          region: true,
          weeklySchedule: true,
          status: true,
          _count: { select: { managers: true } },
          scheduleExceptions: {
            select: { month: true, day: true, year: true, isOpen: true, from: true, to: true },
          },
        },
        orderBy: { name: 'asc' },
      }),

      prisma.$queryRaw<{ storeId: string; revenue: unknown }[]>`
        SELECT "storeId", COALESCE(SUM("grandTotal"), 0) AS revenue
        FROM "Order"
        WHERE "companyId" = ${companyId}
          AND state = 'PAID'
          AND "paidAt"::date = ${today}::date
        GROUP BY "storeId"
      `,

      prisma.$queryRaw<{ storeId: string; cost: unknown; coveredRevenue: unknown }[]>`
        SELECT o."storeId" AS "storeId",
               COALESCE(SUM(oi.quantity * p."costPrice"), 0) AS cost,
               COALESCE(SUM(oi."lineTotal"), 0) AS "coveredRevenue"
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o."companyId" = ${companyId}
          AND o.state = 'PAID'
          AND o."paidAt"::date = ${today}::date
          AND p."costPrice" IS NOT NULL
        GROUP BY o."storeId"
      `,

      prisma.storeProduct.groupBy({
        by: ['storeId'],
        where: { store: { companyId, type: 'SHOP' } },
        _sum: { stock: true },
      }),

      prisma.storeProduct.groupBy({
        by: ['storeId'],
        where: { store: { companyId, type: 'SHOP' }, stock: 0 },
        _count: { storeId: true },
      }),

      prisma.storeProduct.groupBy({
        by: ['storeId'],
        where: { store: { companyId, type: 'SHOP' }, stock: { gt: 0, lt: 10 } },
        _count: { storeId: true },
      }),

      prisma.shift.findMany({
        where: { companyId, status: 'OPEN' },
        select: { storeId: true },
        distinct: ['storeId'],
      }),
    ])

  const revenueMap = new Map(revenueRows.map(r => [r.storeId, Number(r.revenue)]))
  const costMap = new Map(costRows.map(r => [r.storeId, { cost: Number(r.cost), coveredRevenue: Number(r.coveredRevenue) }]))
  const stockMap = new Map(stockAgg.map(r => [r.storeId, Number(r._sum.stock ?? 0)]))
  const outOfStockMap = new Map(outOfStock.map(r => [r.storeId, r._count.storeId]))
  const lowStockMap = new Map(lowStock.map(r => [r.storeId, r._count.storeId]))
  const openShiftIds = new Set(openShifts.map(s => s.storeId))

  return stores.map(s => {
    const revenue = revenueMap.get(s.id) ?? 0
    const costEntry = costMap.has(s.id) ? costMap.get(s.id)! : null
    const realizedMarginToday = costEntry === null ? null : costEntry.coveredRevenue - costEntry.cost
    const realizedMarginPctToday =
      realizedMarginToday === null || revenue === 0
        ? null
        : (realizedMarginToday / revenue) * 100
    return {
      id: s.id,
      name: s.name,
      address: s.address,
      region: s.region,
      weeklySchedule: s.weeklySchedule as TWeeklySchedule | null,
      scheduleExceptions: s.scheduleExceptions,
      status: s.status,
      revenueToday: revenue,
      realizedMarginToday,
      realizedMarginPctToday,
      stockTotal: stockMap.get(s.id) ?? 0,
      outOfStockCount: outOfStockMap.get(s.id) ?? 0,
      lowStockCount: lowStockMap.get(s.id) ?? 0,
      managersCount: s._count.managers,
      hasOpenShift: openShiftIds.has(s.id),
    }
  })
}
