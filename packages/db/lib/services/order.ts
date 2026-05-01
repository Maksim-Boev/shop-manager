import type { Order, OrderItem, PrismaClient } from '../../generated/prisma/client'
import { Prisma } from '../../generated/prisma/client'
import { getNextOrderNumber } from '../order-counter'
import { withPointsLock } from '../points-lock'
import { InsufficientPointsError, OrderStateError, ProductNotAvailableError, ShiftNotOpenError, ShopError } from './errors'
import { applyDiscountsInTx } from './discount'

const D = Prisma.Decimal

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

// ─── private helpers ──────────────────────────────────────────────────────────

const _recalcOrder = async (tx: Tx, orderId: string): Promise<void> => {
  const items = await tx.orderItem.findMany({ where: { orderId } })
  let subtotal = new D('0')
  let discountTotal = new D('0')
  let taxTotal = new D('0')

  for (const item of items) {
    subtotal = subtotal.add(new D(item.originalUnitPrice).mul(item.quantity))
    discountTotal = discountTotal.add(item.discountTotal)
    const lineTotal = new D(item.lineTotal)
    const rate = new D(item.taxRateSnapshot)
    const taxPerLine = lineTotal.sub(lineTotal.div(rate.add(1))).toDecimalPlaces(2, 4)
    taxTotal = taxTotal.add(taxPerLine)
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      grandTotal: subtotal.sub(discountTotal).toFixed(2),
    },
  })
}

const _refreshSnapshotsAndRecalc = async (tx: Tx, orderId: string): Promise<void> => {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })
  if (order.items.length === 0) throw new ShopError('empty order')

  for (const item of order.items) {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: item.productId },
      include: { taxRate: true },
    })
    const storeProduct = await tx.storeProduct.findUnique({
      where: { storeId_productId: { storeId: order.storeId, productId: item.productId } },
    })
    const unitPrice = storeProduct?.priceOverride ?? product.basePrice
    const lineTotal = new D(unitPrice).mul(item.quantity).toDecimalPlaces(2, 4)

    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        productNameSnapshot: product.name,
        unitSnapshot: product.unit,
        originalUnitPrice: new D(unitPrice).toFixed(2),
        taxRateSnapshot: new D(product.taxRate.rate).toFixed(4),
        lineTotal: lineTotal.toFixed(2),
      },
    })
  }

  await _recalcOrder(tx, orderId)
}

const _createSaleMovements = async (
  tx: Tx,
  order: Order & { items: OrderItem[] },
): Promise<void> => {
  for (const item of order.items) {
    const negQty = new D(item.quantity).neg().toFixed(3)
    await tx.stockMovement.create({
      data: {
        companyId: order.companyId,
        storeId: order.storeId,
        productId: item.productId,
        quantity: negQty,
        type: 'SALE',
        orderItemId: item.id,
        occurredAt: new Date(),
      },
    })
    await tx.storeProduct.upsert({
      where: { storeId_productId: { storeId: order.storeId, productId: item.productId } },
      create: { storeId: order.storeId, productId: item.productId, stock: negQty, isAvailable: true },
      update: { stock: { decrement: item.quantity } },
    })
  }
}

const _processPoints = async (
  tx: Tx,
  order: Order & { items: OrderItem[] },
  pointsToRedeem: number,
): Promise<void> => {
  if (!order.customerId) return

  const company = await tx.company.findUniqueOrThrow({ where: { id: order.companyId } })

  await withPointsLock(tx, order.customerId, async () => {
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId! } })
    let balance = customer.pointsBalance
    const now = new Date()

    if (pointsToRedeem > 0) {
      await tx.pointsTransaction.create({
        data: {
          companyId: order.companyId,
          customerId: order.customerId!,
          orderId: order.id,
          type: 'SPEND',
          amount: -pointsToRedeem,
          balanceAfter: balance - pointsToRedeem,
          occurredAt: now,
        },
      })
      await tx.customer.update({
        where: { id: order.customerId! },
        data: { pointsBalance: { decrement: pointsToRedeem } },
      })
      balance -= pointsToRedeem
    }

    // Earn on pre-redemption basis: restore the points discount so redeeming points
    // doesn't reduce future earning capacity
    const pointsDiscount = new D(pointsToRedeem).mul(company.pointsRedemptionRate)
    const earned = new D(order.grandTotal)
      .add(pointsDiscount)
      .mul(company.pointsEarnPercent)
      .floor()
      .toNumber()

    let expiresAt: Date | null = null
    if (company.pointsExpiryMode === 'AFTER_EARN_DAYS' && company.pointsExpiryDays) {
      expiresAt = new Date(now.getTime() + company.pointsExpiryDays * 24 * 60 * 60 * 1000)
    }

    if (earned > 0) {
      await tx.pointsTransaction.create({
        data: {
          companyId: order.companyId,
          customerId: order.customerId!,
          orderId: order.id,
          type: 'EARN',
          amount: earned,
          balanceAfter: balance + earned,
          occurredAt: now,
          expiresAt,
        },
      })
    }

    await tx.customer.update({
      where: { id: order.customerId! },
      data: {
        ...(earned > 0 ? { pointsBalance: { increment: earned } } : {}),
        totalSpent: { increment: new D(order.grandTotal).toFixed(2) },
        lastPurchaseAt: now,
      },
    })

    await tx.order.update({
      where: { id: order.id },
      data: { pointsEarned: earned },
    })
  })
}

// ─── public service functions ─────────────────────────────────────────────────

export const createOrder = async (
  db: PrismaClient,
  params: {
    companyId: string
    storeId: string
    cashierUserId: string
    shiftId: string
    customerId?: string
    deliveryType?: 'PICKUP' | 'DELIVERY'
  },
): Promise<Order> =>
  db.$transaction(async tx => {
    const shift = await tx.shift.findUnique({ where: { id: params.shiftId } })
    if (!shift || shift.status !== 'OPEN') throw new ShiftNotOpenError('shift is not open')
    if (shift.cashierUserId !== params.cashierUserId) throw new ShopError('not your shift')

    const orderNumber = await getNextOrderNumber(tx, params.storeId)

    return tx.order.create({
      data: {
        companyId: params.companyId,
        storeId: params.storeId,
        cashierUserId: params.cashierUserId,
        shiftId: params.shiftId,
        customerId: params.customerId,
        orderNumber,
        deliveryType: params.deliveryType ?? 'PICKUP',
        state: 'DRAFT',
      },
    })
  })

export const addOrderItem = async (
  db: PrismaClient,
  params: { orderId: string; productId: string; quantity: string },
): Promise<OrderItem> =>
  db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } })
    if (!order) throw new ShopError('order not found')
    if (order.state !== 'DRAFT') throw new OrderStateError(`cannot modify order in state ${order.state}`)

    const product = await tx.product.findUnique({
      where: { id: params.productId },
      include: { taxRate: true },
    })
    if (!product || product.status !== 'ACTIVE') throw new ProductNotAvailableError('product not available')

    const storeProduct = await tx.storeProduct.findUnique({
      where: { storeId_productId: { storeId: order.storeId, productId: params.productId } },
    })
    if (storeProduct && !storeProduct.isAvailable) throw new ProductNotAvailableError('product not available in this store')

    const unitPrice = storeProduct?.priceOverride ?? product.basePrice
    const qty = new D(params.quantity)
    const lineTotal = new D(unitPrice).mul(qty).toDecimalPlaces(2, 4)

    const item = await tx.orderItem.create({
      data: {
        orderId: params.orderId,
        productId: params.productId,
        productNameSnapshot: product.name,
        unitSnapshot: product.unit,
        originalUnitPrice: new D(unitPrice).toFixed(2),
        taxRateSnapshot: new D(product.taxRate.rate).toFixed(4),
        quantity: qty.toFixed(3),
        discountTotal: '0',
        lineTotal: lineTotal.toFixed(2),
      },
    })

    await _recalcOrder(tx, params.orderId)
    return item
  })

export const removeOrderItem = async (
  db: PrismaClient,
  params: { orderItemId: string },
): Promise<void> =>
  db.$transaction(async tx => {
    const item = await tx.orderItem.findUnique({ where: { id: params.orderItemId } })
    if (!item) throw new ShopError('order item not found')
    const order = await tx.order.findUnique({ where: { id: item.orderId } })
    if (!order || order.state !== 'DRAFT') {
      throw new OrderStateError(`cannot modify order in state ${order?.state ?? 'unknown'}`)
    }
    await tx.orderItem.delete({ where: { id: params.orderItemId } })
    await _recalcOrder(tx, item.orderId)
  })

export const updateOrderItemQty = async (
  db: PrismaClient,
  params: { orderItemId: string; quantity: string },
): Promise<OrderItem> =>
  db.$transaction(async tx => {
    const item = await tx.orderItem.findUnique({ where: { id: params.orderItemId } })
    if (!item) throw new ShopError('order item not found')
    const order = await tx.order.findUnique({ where: { id: item.orderId } })
    if (!order || order.state !== 'DRAFT') {
      throw new OrderStateError(`cannot modify order in state ${order?.state ?? 'unknown'}`)
    }

    const qty = new D(params.quantity)
    if (qty.lte(0)) throw new ShopError('quantity must be positive')

    const lineTotal = new D(item.originalUnitPrice).mul(qty).toDecimalPlaces(2, 4)
    const updated = await tx.orderItem.update({
      where: { id: params.orderItemId },
      data: { quantity: qty.toFixed(3), lineTotal: lineTotal.toFixed(2) },
    })

    await _recalcOrder(tx, item.orderId)
    return updated
  })

export const confirmOrder = async (
  db: PrismaClient,
  params: { orderId: string },
): Promise<Order> =>
  db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } })
    if (!order) throw new ShopError('order not found')
    if (order.state !== 'DRAFT') throw new OrderStateError(`cannot confirm order in state ${order.state}`)

    await _refreshSnapshotsAndRecalc(tx, params.orderId)
    await applyDiscountsInTx(tx, params.orderId, 0)

    return tx.order.update({ where: { id: params.orderId }, data: { state: 'PENDING' } })
  })

export const payOrder = async (
  db: PrismaClient,
  params: {
    orderId: string
    paymentMethod: 'CASH' | 'CARD' | 'MANUAL'
    paidAmount: string
    pointsToRedeem?: number
  },
): Promise<Order> =>
  db.$transaction(async tx => {
    let order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    })
    if (!order) throw new ShopError('order not found')
    if (!['DRAFT', 'PENDING'].includes(order.state)) {
      throw new OrderStateError(`cannot pay order in state ${order.state}`)
    }

    if (order.state === 'DRAFT') {
      await _refreshSnapshotsAndRecalc(tx, params.orderId)
    }

    const pointsToRedeem = params.pointsToRedeem ?? 0
    if (pointsToRedeem > 0 && !order.customerId) throw new ShopError('no customer on order')

    // Применяем скидки (включая баллы); InsufficientPointsError бросается внутри
    await applyDiscountsInTx(tx, params.orderId, pointsToRedeem)

    // Перечитываем после refresh + discount (grandTotal финальный)
    order = await tx.order.findUniqueOrThrow({
      where: { id: params.orderId },
      include: { items: true },
    })

    if (new D(params.paidAmount).lt(order.grandTotal)) {
      throw new ShopError('insufficient payment')
    }

    await tx.order.update({
      where: { id: params.orderId },
      data: {
        state: 'PAID',
        paymentMethod: params.paymentMethod,
        paidAmount: params.paidAmount,
        paidAt: new Date(),
        pointsRedeemed: pointsToRedeem,
      },
    })

    await _createSaleMovements(tx, order)
    await _processPoints(tx, order, pointsToRedeem)

    return tx.order.findUniqueOrThrow({ where: { id: params.orderId } })
  })

export const fulfillOrder = async (
  db: PrismaClient,
  params: { orderId: string },
): Promise<Order> =>
  db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } })
    if (!order) throw new ShopError('order not found')
    if (order.state !== 'PAID') throw new OrderStateError(`cannot fulfill order in state ${order.state}`)
    return tx.order.update({ where: { id: params.orderId }, data: { state: 'FULFILLED' } })
  })

export const cancelOrder = async (
  db: PrismaClient,
  params: { orderId: string },
): Promise<Order> =>
  db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } })
    if (!order) throw new ShopError('order not found')
    if (!['DRAFT', 'PENDING'].includes(order.state)) {
      throw new OrderStateError(`cannot cancel order in state ${order.state}`)
    }
    return tx.order.update({ where: { id: params.orderId }, data: { state: 'CANCELLED' } })
  })
