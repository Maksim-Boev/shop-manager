import { prisma } from '../prisma'
import type { OrderState, PaymentMethod, DeliveryType, DeliveryStatus, ProductUnit } from '@/generated/prisma/enums'

export interface IOrderRow {
  id: string
  orderNumber: number
  storeId: string
  storeName: string
  state: OrderState
  paymentMethod: PaymentMethod | null
  grandTotal: number
  itemCount: number
  cashierName: string
  createdAt: Date
  paidAt: Date | null
}

export interface IOrderItemRow {
  id: string
  productNameSnapshot: string
  unitSnapshot: ProductUnit
  originalUnitPrice: number
  quantity: number
  discountTotal: number
  lineTotal: number
  taxRateSnapshot: number
}

export interface IOrderDetail {
  id: string
  orderNumber: number
  store: { id: string; name: string; address: string | null }
  state: OrderState
  paymentMethod: PaymentMethod | null
  deliveryType: DeliveryType
  deliveryAddress: Record<string, unknown> | null
  deliveryStatus: DeliveryStatus
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  pointsRedeemed: number
  pointsEarned: number
  paidAt: Date | null
  createdAt: Date
  cashier: { id: string; firstName: string; lastName: string }
  shift: { id: string; openedAt: Date; closedAt: Date | null } | null
  items: IOrderItemRow[]
}

export const getOrders = async (companyId: string): Promise<IOrderRow[]> => {
  const orders = await prisma.order.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      orderNumber: true,
      storeId: true,
      state: true,
      paymentMethod: true,
      grandTotal: true,
      cashierUserId: true,
      createdAt: true,
      paidAt: true,
      _count: { select: { items: true } },
    },
  })

  if (orders.length === 0) return []

  const storeIds = [...new Set(orders.map(o => o.storeId))]
  const cashierIds = [...new Set(orders.map(o => o.cashierUserId))]

  const [stores, cashiers] = await Promise.all([
    prisma.store.findMany({
      where: { id: { in: storeIds }, companyId },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { id: { in: cashierIds }, companyId },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  const storeMap = new Map(stores.map(s => [s.id, s.name]))
  const cashierMap = new Map(cashiers.map(c => [c.id, `${c.firstName} ${c.lastName}`]))

  return orders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    storeId: o.storeId,
    storeName: storeMap.get(o.storeId) ?? o.storeId,
    state: o.state,
    paymentMethod: o.paymentMethod,
    grandTotal: Number(o.grandTotal),
    itemCount: o._count.items,
    cashierName: cashierMap.get(o.cashierUserId) ?? o.cashierUserId,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
  }))
}

export const getRelatedOrders = async (
  companyId: string,
  storeId: string,
  excludeId: string,
  date: Date,
): Promise<IOrderRow[]> => {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: { companyId, storeId, id: { not: excludeId }, createdAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: {
      id: true, orderNumber: true, storeId: true, state: true,
      paymentMethod: true, grandTotal: true, cashierUserId: true,
      createdAt: true, paidAt: true,
      _count: { select: { items: true } },
    },
  })

  if (orders.length === 0) return []

  const cashierIds = [...new Set(orders.map(o => o.cashierUserId))]
  const cashiers = await prisma.user.findMany({
    where: { id: { in: cashierIds }, companyId },
    select: { id: true, firstName: true, lastName: true },
  })
  const cashierMap = new Map(cashiers.map(c => [c.id, `${c.firstName} ${c.lastName}`]))

  const store = await prisma.store.findFirst({
    where: { id: storeId, companyId },
    select: { name: true },
  })
  const storeName = store?.name ?? storeId

  return orders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    storeId: o.storeId,
    storeName,
    state: o.state,
    paymentMethod: o.paymentMethod,
    grandTotal: Number(o.grandTotal),
    itemCount: o._count.items,
    cashierName: cashierMap.get(o.cashierUserId) ?? o.cashierUserId,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
  }))
}

export const getOrderDetail = async (
  companyId: string,
  orderId: string,
): Promise<IOrderDetail | null> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId },
    select: {
      id: true,
      orderNumber: true,
      storeId: true,
      state: true,
      paymentMethod: true,
      deliveryType: true,
      deliveryAddress: true,
      deliveryStatus: true,
      subtotal: true,
      discountTotal: true,
      taxTotal: true,
      grandTotal: true,
      pointsRedeemed: true,
      pointsEarned: true,
      paidAt: true,
      createdAt: true,
      cashierUserId: true,
      shiftId: true,
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          unitSnapshot: true,
          originalUnitPrice: true,
          taxRateSnapshot: true,
          quantity: true,
          discountTotal: true,
          lineTotal: true,
        },
      },
    },
  })

  if (!order) return null

  const [store, cashier, shift] = await Promise.all([
    prisma.store.findFirst({
      where: { id: order.storeId, companyId },
      select: { id: true, name: true, address: true },
    }),
    prisma.user.findFirst({
      where: { id: order.cashierUserId, companyId },
      select: { id: true, firstName: true, lastName: true },
    }),
    order.shiftId
      ? prisma.shift.findFirst({
          where: { id: order.shiftId },
          select: { id: true, openedAt: true, closedAt: true },
        })
      : Promise.resolve(null),
  ])

  if (!store || !cashier) return null

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    store: { id: store.id, name: store.name, address: store.address },
    state: order.state,
    paymentMethod: order.paymentMethod,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress as Record<string, unknown> | null,
    deliveryStatus: order.deliveryStatus,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    grandTotal: Number(order.grandTotal),
    pointsRedeemed: order.pointsRedeemed,
    pointsEarned: order.pointsEarned,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    cashier: { id: cashier.id, firstName: cashier.firstName, lastName: cashier.lastName },
    shift: shift ? { id: shift.id, openedAt: shift.openedAt, closedAt: shift.closedAt } : null,
    items: order.items.map(i => ({
      id: i.id,
      productNameSnapshot: i.productNameSnapshot,
      unitSnapshot: i.unitSnapshot,
      originalUnitPrice: Number(i.originalUnitPrice),
      quantity: Number(i.quantity),
      discountTotal: Number(i.discountTotal),
      lineTotal: Number(i.lineTotal),
      taxRateSnapshot: Number(i.taxRateSnapshot),
    })),
  }
}

export interface ICashierDayStats {
  orderCount: number
  revenue: number
}

export const getCashierDayStats = async (
  companyId: string,
  cashierId: string,
  date: Date,
): Promise<ICashierDayStats> => {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const rows = await prisma.order.findMany({
    where: {
      companyId,
      cashierUserId: cashierId,
      createdAt: { gte: dayStart, lte: dayEnd },
      state: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
    select: { grandTotal: true },
  })

  return {
    orderCount: rows.length,
    revenue: rows.reduce((s, o) => s + Number(o.grandTotal), 0),
  }
}
