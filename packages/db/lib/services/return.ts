import type { PrismaClient } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'
import { withPointsLock } from '../points-lock'
import { ExcessReturnQuantityError, OrderStateError, ReturnStateError, ShiftNotOpenError, ShopError } from './errors'

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
const D = Prisma.Decimal

export const createReturn = async (
  db: PrismaClient,
  params: {
    companyId: string
    storeId: string
    orderId: string
    shiftId: string
    reasonCode: 'BRAK' | 'NOT_FIT' | 'REFUSAL' | 'OTHER'
    reasonNotes?: string
    refundMethod: 'CASH' | 'CARD' | 'MANUAL'
    createdByUserId: string
    items: Array<{ orderItemId: string; quantity: string; unitRefundAmount: string }>
  },
) =>
  db.$transaction(async (tx: Tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    })
    if (!order || !['PAID', 'FULFILLED'].includes(order.state)) {
      throw new OrderStateError('order must be PAID or FULFILLED to create a return')
    }

    const shift = await tx.shift.findUnique({ where: { id: params.shiftId } })
    if (!shift || shift.status !== 'OPEN') throw new ShiftNotOpenError('shift must be open to create a return')

    const orderItemMap = new Map(order.items.map(i => [i.id, i]))
    let refundAmount = new D('0')

    for (const ri of params.items) {
      const orderItem = orderItemMap.get(ri.orderItemId)
      if (!orderItem) throw new ShopError('order item not found in order')

      if (new D(ri.quantity).lte(0)) throw new ShopError('quantity must be positive')

      const alreadyReturned = await tx.returnItem.aggregate({
        where: { orderItemId: ri.orderItemId, return_: { state: 'APPLIED' } },
        _sum: { quantity: true },
      })
      const maxReturnable = new D(orderItem.quantity).sub(new D(alreadyReturned._sum.quantity ?? '0'))
      if (new D(ri.quantity).gt(maxReturnable)) {
        throw new ExcessReturnQuantityError(
          `cannot return ${ri.quantity} of item ${ri.orderItemId}, max ${maxReturnable.toFixed(3)}`,
        )
      }

      refundAmount = refundAmount.add(new D(ri.quantity).mul(new D(ri.unitRefundAmount)))
    }

    return tx.return.create({
      data: {
        companyId: params.companyId,
        storeId: params.storeId,
        orderId: params.orderId,
        shiftId: params.shiftId,
        state: 'DRAFT',
        reasonCode: params.reasonCode,
        reasonNotes: params.reasonNotes,
        refundMethod: params.refundMethod,
        refundAmount: refundAmount.toFixed(2),
        createdByUserId: params.createdByUserId,
        items: {
          create: params.items.map(ri => ({
            orderItemId: ri.orderItemId,
            quantity: new D(ri.quantity).toFixed(3),
            unitRefundAmount: new D(ri.unitRefundAmount).toFixed(2),
            refundSubtotal: new D(ri.quantity).mul(new D(ri.unitRefundAmount)).toFixed(2),
          })),
        },
      },
    })
  })

export const applyReturn = async (db: PrismaClient, params: { returnId: string }) =>
  db.$transaction(async (tx: Tx) => {
    const returnDoc = await tx.return.findUnique({
      where: { id: params.returnId },
      include: { items: true },
    })
    if (!returnDoc || returnDoc.state !== 'DRAFT') throw new ReturnStateError('return must be DRAFT to apply')

    const order = await tx.order.findUniqueOrThrow({ where: { id: returnDoc.orderId } })
    const now = new Date()

    // Stock movements
    for (const ri of returnDoc.items) {
      const orderItem = await tx.orderItem.findUniqueOrThrow({ where: { id: ri.orderItemId } })
      await tx.stockMovement.create({
        data: {
          companyId: returnDoc.companyId,
          storeId: returnDoc.storeId,
          productId: orderItem.productId,
          quantity: new D(ri.quantity).toFixed(3),
          type: 'RETURN',
          returnItemId: ri.id,
          occurredAt: now,
        },
      })
      await tx.storeProduct.upsert({
        where: { storeId_productId: { storeId: returnDoc.storeId, productId: orderItem.productId } },
        create: { storeId: returnDoc.storeId, productId: orderItem.productId, stock: ri.quantity, isAvailable: true },
        update: { stock: { increment: ri.quantity } },
      })
    }

    // Points reversal
    if (order.customerId) {
      await withPointsLock(tx, order.customerId, async () => {
        const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId! } })
        const ratio = new D(returnDoc.refundAmount).div(order.grandTotal)

        const alreadyEarnAgg = await tx.pointsTransaction.aggregate({
          where: { orderId: order.id, type: 'REFUND_EARN_REVERSAL' },
          _sum: { amount: true },
        })
        const alreadySpendAgg = await tx.pointsTransaction.aggregate({
          where: { orderId: order.id, type: 'REFUND_SPEND_REVERSAL' },
          _sum: { amount: true },
        })

        const alreadyEarnReversed = Math.abs(alreadyEarnAgg._sum.amount ?? 0)
        const alreadySpendReversed = alreadySpendAgg._sum.amount ?? 0

        const earnReversal = Math.min(
          Math.floor(ratio.mul(order.pointsEarned).toNumber()),
          Math.max(0, order.pointsEarned - alreadyEarnReversed),
        )
        const spendReversal = Math.min(
          Math.floor(ratio.mul(order.pointsRedeemed).toNumber()),
          Math.max(0, order.pointsRedeemed - alreadySpendReversed),
        )

        let balance = customer.pointsBalance

        if (earnReversal > 0) {
          await tx.pointsTransaction.create({
            data: {
              companyId: order.companyId,
              customerId: order.customerId!,
              orderId: order.id,
              returnId: params.returnId,
              type: 'REFUND_EARN_REVERSAL',
              amount: -earnReversal,
              balanceAfter: balance - earnReversal,
              occurredAt: now,
            },
          })
          balance -= earnReversal
        }

        if (spendReversal > 0) {
          await tx.pointsTransaction.create({
            data: {
              companyId: order.companyId,
              customerId: order.customerId!,
              orderId: order.id,
              returnId: params.returnId,
              type: 'REFUND_SPEND_REVERSAL',
              amount: spendReversal,
              balanceAfter: balance + spendReversal,
              occurredAt: now,
            },
          })
          balance += spendReversal
        }

        await tx.customer.update({
          where: { id: order.customerId! },
          data: {
            pointsBalance: balance,
            totalSpent: { decrement: new D(returnDoc.refundAmount).toFixed(2) },
          },
        })
      })
    }

    const applied = await tx.return.update({
      where: { id: params.returnId },
      data: { state: 'APPLIED', appliedAt: now },
    })

    // Check if order is fully returned → REFUNDED
    const allOrderItems = await tx.orderItem.findMany({ where: { orderId: order.id } })
    const allReturnItems = await tx.returnItem.findMany({
      where: {
        orderItemId: { in: allOrderItems.map(i => i.id) },
        return_: { state: 'APPLIED' },
      },
    })
    const returnedQtyMap = new Map<string, Prisma.Decimal>()
    for (const ri of allReturnItems) {
      returnedQtyMap.set(ri.orderItemId, (returnedQtyMap.get(ri.orderItemId) ?? new D('0')).add(ri.quantity))
    }
    const allFullyReturned = allOrderItems.every(oi =>
      (returnedQtyMap.get(oi.id) ?? new D('0')).gte(new D(oi.quantity))
    )
    if (allFullyReturned) {
      await tx.order.update({ where: { id: order.id }, data: { state: 'REFUNDED' } })
    }

    return applied
  })

export const cancelReturn = async (db: PrismaClient, params: { returnId: string }) =>
  db.$transaction(async (tx: Tx) => {
    const returnDoc = await tx.return.findUnique({ where: { id: params.returnId } })
    if (!returnDoc || returnDoc.state !== 'DRAFT') throw new ReturnStateError('return must be DRAFT to cancel')
    return tx.return.update({ where: { id: params.returnId }, data: { state: 'CANCELLED' } })
  })
