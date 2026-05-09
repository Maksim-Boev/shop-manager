import type { PrismaClient, Shift, ShiftReport } from '../../generated/prisma/client'
import { Prisma } from '../../generated/prisma/client'
import { ShiftAlreadyOpenError, ShiftNotOpenError, ShopError } from './errors'

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
const D = Prisma.Decimal

export const openShift = async (
  db: PrismaClient,
  params: { companyId: string; storeId: string; cashierUserId: string; openingCash: string },
): Promise<Shift> =>
  db.$transaction(async tx => {
    const store = await tx.store.findFirst({
      where: { id: params.storeId, companyId: params.companyId },
    })
    if (!store || store.status !== 'ACTIVE' || store.type !== 'SHOP') {
      throw new ShopError('store not available')
    }
    const user = await tx.user.findFirst({
      where: { id: params.cashierUserId, companyId: params.companyId },
      select: { role: true },
    })
    if (!user) throw new ShopError('cashier not found')
    if (user.role === 'SALESPERSON') {
      throw new ShopError('Продавець не має доступу до каси')
    }
    const existing = await tx.shift.findFirst({
      where: { companyId: params.companyId, cashierUserId: params.cashierUserId, status: 'OPEN' },
    })
    if (existing) throw new ShiftAlreadyOpenError('cashier already has an open shift')
    return tx.shift.create({ data: { ...params, status: 'OPEN' } })
  })

const _buildReportSnapshot = async (tx: Tx, shiftId: string) => {
  const orders = await tx.order.findMany({
    where: { shiftId, state: { in: ['PAID', 'FULFILLED'] } },
    include: { items: true },
  })
  const appliedReturns = await tx.return.findMany({ where: { shiftId, state: 'APPLIED' } })

  let totalSales = new D('0')
  let cashSales = new D('0')
  let cardSales = new D('0')
  let manualSales = new D('0')
  const taxByRate: Record<string, Prisma.Decimal> = {}

  for (const order of orders) {
    totalSales = totalSales.add(order.grandTotal)
    const paid = order.paidAmount ?? new D('0')
    if (order.paymentMethod === 'CASH') cashSales = cashSales.add(paid)
    else if (order.paymentMethod === 'CARD') cardSales = cardSales.add(paid)
    else if (order.paymentMethod === 'MANUAL') manualSales = manualSales.add(paid)

    for (const item of order.items) {
      const lineTotal = new D(item.lineTotal)
      const rate = new D(item.taxRateSnapshot)
      const taxPerLine = lineTotal.sub(lineTotal.div(rate.add(1))).toDecimalPlaces(2, 4)
      const key = item.taxRateSnapshot.toString()
      taxByRate[key] = (taxByRate[key] ?? new D('0')).add(taxPerLine)
    }
  }

  const totalRefunds = appliedReturns.reduce((sum, r) => sum.add(r.refundAmount), new D('0'))

  return {
    totalSales: totalSales.toFixed(2),
    totalRefunds: totalRefunds.toFixed(2),
    orderCount: orders.length,
    receiptCount: orders.length,
    paymentBreakdown: {
      CASH: cashSales.toFixed(2),
      CARD: cardSales.toFixed(2),
      MANUAL: manualSales.toFixed(2),
    },
    taxBreakdown: Object.fromEntries(
      Object.entries(taxByRate).map(([k, v]) => [k, v.toFixed(2)]),
    ),
  }
}

export const closeShift = async (
  db: PrismaClient,
  params: { shiftId: string; cashierUserId: string; closingCash: string },
): Promise<Shift> =>
  db.$transaction(async tx => {
    const shift = await tx.shift.findUnique({ where: { id: params.shiftId } })
    if (!shift || shift.status !== 'OPEN') throw new ShiftNotOpenError('shift is not open')
    if (shift.cashierUserId !== params.cashierUserId) throw new ShopError('not your shift')

    const cashOrders = await tx.order.aggregate({
      where: { shiftId: params.shiftId, paymentMethod: 'CASH', state: { in: ['PAID', 'FULFILLED'] } },
      _sum: { paidAmount: true },
    })
    const cashReturns = await tx.return.aggregate({
      where: { shiftId: params.shiftId, refundMethod: 'CASH', state: 'APPLIED' },
      _sum: { refundAmount: true },
    })

    const cashIn = cashOrders._sum.paidAmount ?? new D('0')
    const cashOut = cashReturns._sum.refundAmount ?? new D('0')
    const expectedCash = new D(shift.openingCash).add(cashIn).sub(cashOut)
    const variance = new D(params.closingCash).sub(expectedCash)

    const updated = await tx.shift.update({
      where: { id: params.shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingCash: params.closingCash,
        expectedCash: expectedCash.toFixed(2),
        variance: variance.toFixed(2),
      },
    })

    const store = await tx.store.findUnique({ where: { id: shift.storeId } })
    if (store?.enableFiscalReports) {
      await tx.shiftReport.create({
        data: {
          shiftId: params.shiftId,
          type: 'Z',
          snapshot: await _buildReportSnapshot(tx, params.shiftId),
        },
      })
    }

    return updated
  })

export const generateShiftReport = async (
  db: PrismaClient,
  params: { shiftId: string; type: 'X' },
): Promise<ShiftReport> =>
  db.$transaction(async tx => {
    const shift = await tx.shift.findUnique({ where: { id: params.shiftId } })
    if (!shift || shift.status !== 'OPEN') throw new ShiftNotOpenError('shift is not open')

    const store = await tx.store.findUnique({ where: { id: shift.storeId } })
    if (!store?.enableFiscalReports) throw new ShopError('fiscal reports disabled')

    return tx.shiftReport.create({
      data: {
        shiftId: params.shiftId,
        type: params.type,
        printedAt: new Date(),
        snapshot: await _buildReportSnapshot(tx, params.shiftId),
      },
    })
  })
