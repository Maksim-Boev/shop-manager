import { prisma } from '../prisma'

export interface IShopWithStats {
  id: string
  name: string
  address: string | null
  region: string | null
  openingHours: string | null
  status: 'ACTIVE' | 'ARCHIVED'
  revenueToday: number
  stockTotal: number
  outOfStockCount: number
  lowStockCount: number
  managersCount: number
  hasOpenShift: boolean
}

export const getShopsWithStats = async (companyId: string): Promise<IShopWithStats[]> => {
  const today = new Date().toISOString().slice(0, 10)

  const [stores, revenueRows, stockAgg, outOfStock, lowStock, openShifts] = await Promise.all([
    prisma.store.findMany({
      where: { companyId, type: 'SHOP' },
      select: {
        id: true,
        name: true,
        address: true,
        region: true,
        openingHours: true,
        status: true,
        _count: { select: { managers: true } },
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

    prisma.storeProduct.groupBy({
      by: ['storeId'],
      where: { store: { companyId, type: 'SHOP' } },
      _sum: { stock: true },
    }),

    prisma.storeProduct.groupBy({
      by: ['storeId'],
      where: {
        store: { companyId, type: 'SHOP' },
        stock: 0,
      },
      _count: { storeId: true },
    }),

    prisma.storeProduct.groupBy({
      by: ['storeId'],
      where: {
        store: { companyId, type: 'SHOP' },
        stock: { gt: 0, lt: 10 },
      },
      _count: { storeId: true },
    }),

    prisma.shift.findMany({
      where: { companyId, status: 'OPEN' },
      select: { storeId: true },
      distinct: ['storeId'],
    }),
  ])

  const revenueMap = new Map(revenueRows.map(r => [r.storeId, Number(r.revenue)]))
  const stockMap = new Map(stockAgg.map(r => [r.storeId, Number(r._sum.stock ?? 0)]))
  const outOfStockMap = new Map(outOfStock.map(r => [r.storeId, r._count.storeId]))
  const lowStockMap = new Map(lowStock.map(r => [r.storeId, r._count.storeId]))
  const openShiftIds = new Set(openShifts.map(s => s.storeId))

  return stores.map(s => ({
    id: s.id,
    name: s.name,
    address: s.address,
    region: s.region,
    openingHours: s.openingHours,
    status: s.status,
    revenueToday: revenueMap.get(s.id) ?? 0,
    stockTotal: stockMap.get(s.id) ?? 0,
    outOfStockCount: outOfStockMap.get(s.id) ?? 0,
    lowStockCount: lowStockMap.get(s.id) ?? 0,
    managersCount: s._count.managers,
    hasOpenShift: openShiftIds.has(s.id),
  }))
}
