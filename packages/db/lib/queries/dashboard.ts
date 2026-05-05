import { prisma } from '../prisma'
import { Decimal } from '@prisma/client/runtime/client'

export interface IDashboardKpis {
  revenueToday: Decimal
  checksCount: number
  avgCheck: Decimal
  stockUnitsTotal: number
  lowStockSkuCount: number
  outOfStockSkuCount: number
  staffOnShift: number
  shopsOpen: number
  shopsTotal: number
}

export interface IRevenueByHour {
  hour: number
  revenue: Decimal
}

export interface ITopShop {
  storeId: string
  name: string
  revenueToday: Decimal
  checksCount: number
}

export interface IActivityEvent {
  id: string
  type: 'SALE' | 'SHIFT_OPEN' | 'TRANSFER'
  text: string
  storeName: string
  occurredAt: Date
}

export interface IAlert {
  type: 'NO_MANAGER' | 'OUT_OF_STOCK' | 'STALE_DRAFT_TRANSFER'
  title: string
  description: string
  count: number
}

export const getDashboardKpis = async (companyId: string, date: Date): Promise<IDashboardKpis> => {
  const dateStr = date.toISOString().slice(0, 10)

  const [revenueResult, stockResult, shiftResult, storeResult] = await Promise.all([
    prisma.$queryRaw<{ revenue: Decimal; checks: bigint }[]>`
      SELECT
        COALESCE(SUM("grandTotal"), 0) AS revenue,
        COUNT(*) AS checks
      FROM "Order"
      WHERE "companyId" = ${companyId}
        AND state = 'PAID'
        AND "paidAt"::date = ${dateStr}::date
    `,
    prisma.storeProduct.aggregate({
      where: {
        store: { companyId, type: 'SHOP', status: 'ACTIVE' },
      },
      _sum: { stock: true },
    }),
    prisma.shift.count({
      where: { companyId, status: 'OPEN' },
    }),
    prisma.store.count({
      where: { companyId, type: 'SHOP', status: 'ACTIVE' },
    }),
  ])

  const revenueToday = revenueResult[0]?.revenue ?? new Decimal(0)
  const checksCount = Number(revenueResult[0]?.checks ?? 0)
  const avgCheck = checksCount > 0 ? revenueToday.div(checksCount) : new Decimal(0)
  const stockUnitsTotal = Number(stockResult._sum.stock ?? 0)

  const [lowStock, outOfStock, shopsWithOpenShift] = await Promise.all([
    prisma.storeProduct.count({
      where: {
        store: { companyId, type: 'SHOP', status: 'ACTIVE' },
        stock: { gt: 0, lt: 10 },
      },
    }),
    prisma.storeProduct.count({
      where: {
        store: { companyId, type: 'SHOP', status: 'ACTIVE' },
        stock: 0,
      },
    }),
    prisma.shift.groupBy({
      by: ['storeId'],
      where: { companyId, status: 'OPEN' },
    }),
  ])

  return {
    revenueToday,
    checksCount,
    avgCheck,
    stockUnitsTotal,
    lowStockSkuCount: lowStock,
    outOfStockSkuCount: outOfStock,
    staffOnShift: shiftResult,
    shopsOpen: shopsWithOpenShift.length,
    shopsTotal: storeResult,
  }
}

export const getRevenueByHour = async (companyId: string, date: Date): Promise<IRevenueByHour[]> => {
  const dateStr = date.toISOString().slice(0, 10)

  const rows = await prisma.$queryRaw<{ hour: number; revenue: Decimal }[]>`
    SELECT
      EXTRACT(HOUR FROM "paidAt")::int AS hour,
      COALESCE(SUM("grandTotal"), 0) AS revenue
    FROM "Order"
    WHERE "companyId" = ${companyId}
      AND state = 'PAID'
      AND "paidAt"::date = ${dateStr}::date
    GROUP BY hour
    ORDER BY hour
  `

  const map = new Map(rows.map(r => [r.hour, r.revenue]))
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    revenue: map.get(h) ?? new Decimal(0),
  }))
}

export const getTopShops = async (
  companyId: string,
  date: Date,
  limit = 5,
): Promise<ITopShop[]> => {
  const dateStr = date.toISOString().slice(0, 10)

  const rows = await prisma.$queryRaw<{ storeId: string; revenue: Decimal; checks: bigint }[]>`
    SELECT
      "storeId",
      COALESCE(SUM("grandTotal"), 0) AS revenue,
      COUNT(*) AS checks
    FROM "Order"
    WHERE "companyId" = ${companyId}
      AND state = 'PAID'
      AND "paidAt"::date = ${dateStr}::date
    GROUP BY "storeId"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `

  if (rows.length === 0) return []

  const storeIds = rows.map(r => r.storeId)
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds }, companyId },
    select: { id: true, name: true },
  })
  const nameMap = new Map(stores.map(s => [s.id, s.name]))

  return rows.map(r => ({
    storeId: r.storeId,
    name: nameMap.get(r.storeId) ?? r.storeId,
    revenueToday: r.revenue,
    checksCount: Number(r.checks),
  }))
}

export const getActivityFeed = async (
  companyId: string,
  limit = 20,
): Promise<IActivityEvent[]> => {
  const [orders, shifts, transfers] = await Promise.all([
    prisma.order.findMany({
      where: { companyId, state: 'PAID' },
      orderBy: { paidAt: 'desc' },
      take: limit,
      select: { id: true, grandTotal: true, storeId: true, paidAt: true },
    }),
    prisma.shift.findMany({
      where: {
        companyId,
        status: 'OPEN',
        openedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { openedAt: 'desc' },
      take: limit,
      select: { id: true, storeId: true, openedAt: true },
    }),
    prisma.stockTransfer.findMany({
      where: { companyId, state: 'IN_TRANSIT' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, sourceStoreId: true, createdAt: true },
    }),
  ])

  const storeIds = [
    ...orders.map(o => o.storeId),
    ...shifts.map(s => s.storeId),
    ...transfers.map(t => t.sourceStoreId),
  ]
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds }, companyId },
    select: { id: true, name: true },
  })
  const nameMap = new Map(stores.map(s => [s.id, s.name]))

  const events: IActivityEvent[] = [
    ...orders.map(o => ({
      id: o.id,
      type: 'SALE' as const,
      text: `Продаж ₴ ${o.grandTotal.toFixed(2)}`,
      storeName: nameMap.get(o.storeId) ?? o.storeId,
      occurredAt: o.paidAt ?? new Date(),
    })),
    ...shifts.map(s => ({
      id: s.id,
      type: 'SHIFT_OPEN' as const,
      text: 'Відкрита зміна',
      storeName: nameMap.get(s.storeId) ?? s.storeId,
      occurredAt: s.openedAt,
    })),
    ...transfers.map(t => ({
      id: t.id,
      type: 'TRANSFER' as const,
      text: 'Переміщення в дорозі',
      storeName: nameMap.get(t.sourceStoreId) ?? t.sourceStoreId,
      occurredAt: t.createdAt,
    })),
  ]

  return events
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit)
}

export const getAlerts = async (companyId: string): Promise<IAlert[]> => {
  const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [shopsWithoutManager, outOfStockCount, staleDrafts] = await Promise.all([
    prisma.store.findMany({
      where: {
        companyId,
        type: 'SHOP',
        status: 'ACTIVE',
        managers: { none: {} },
      },
      select: { name: true },
    }),
    prisma.storeProduct.count({
      where: {
        store: { companyId, type: 'SHOP', status: 'ACTIVE' },
        stock: 0,
      },
    }),
    prisma.stockTransfer.count({
      where: {
        companyId,
        state: 'DRAFT',
        createdAt: { lt: staleBefore },
      },
    }),
  ])

  const alerts: IAlert[] = []

  if (shopsWithoutManager.length > 0) {
    alerts.push({
      type: 'NO_MANAGER',
      title: 'Не призначено керуючого',
      description: shopsWithoutManager.map(s => s.name).join(', '),
      count: shopsWithoutManager.length,
    })
  }

  if (outOfStockCount > 0) {
    alerts.push({
      type: 'OUT_OF_STOCK',
      title: 'Товар закінчився',
      description: `${outOfStockCount} SKU з нульовим залишком`,
      count: outOfStockCount,
    })
  }

  if (staleDrafts > 0) {
    alerts.push({
      type: 'STALE_DRAFT_TRANSFER',
      title: 'Незавершені переміщення',
      description: `${staleDrafts} чернеток старших за 24 год.`,
      count: staleDrafts,
    })
  }

  return alerts
}
