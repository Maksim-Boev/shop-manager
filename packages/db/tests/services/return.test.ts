import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  cleanupTestCompanies,
  createTestCategory,
  createTestCompany,
  createTestCustomer,
  createTestProduct,
  createTestStore,
  createTestUser,
} from '../helpers'
import { addOrderItem, createOrder, payOrder } from '../../lib/services/order'
import { applyReturn, cancelReturn, createReturn } from '../../lib/services/return'
import { ExcessReturnQuantityError, OrderStateError, ReturnStateError, ShiftNotOpenError } from '../../lib/services/errors'
import { openShift } from '../../lib/services/shift'

afterEach(cleanupTestCompanies)

const makePaidOrder = async (opts: { withCustomer?: boolean; quantity?: string; basePrice?: string } = {}) => {
  const company = await createTestCompany()
  const store = await createTestStore(company.id)
  const cashier = await createTestUser(company.id, { role: 'CASHIER' })
  const customer = opts.withCustomer ? await createTestCustomer(company.id) : null
  const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
  const category = await createTestCategory(company.id)
  const product = await createTestProduct(company.id, category.id, { basePrice: opts.basePrice ?? '100.00' })
  const order = await createOrder(prisma, {
    companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id,
    customerId: customer?.id,
  })
  const qty = opts.quantity ?? '2'
  await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: qty })
  const grandTotal = (parseFloat(opts.basePrice ?? '100.00') * parseFloat(qty)).toFixed(2)
  const paid = await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: grandTotal })
  return { company, store, cashier, shift, order: paid, product, category, customer }
}

describe('createReturn', () => {
  it('создаёт возврат в DRAFT со списком позиций', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder()
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })

    const ret = await createReturn(prisma, {
      companyId: company.id,
      storeId: store.id,
      orderId: order.id,
      shiftId: shift.id,
      reasonCode: 'NOT_FIT',
      refundMethod: 'CASH',
      createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })

    expect(ret.state).toBe('DRAFT')
    expect(Number(ret.refundAmount)).toBe(100)

    const retItems = await prisma.returnItem.findMany({ where: { returnId: ret.id } })
    expect(retItems).toHaveLength(1)
    expect(Number(retItems[0].quantity)).toBe(1)
  })

  it('OrderStateError если заказ не PAID/FULFILLED', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id })
    const orderItem = await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    await expect(
      createReturn(prisma, {
        companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
        reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
        items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
      })
    ).rejects.toThrow(OrderStateError)
  })

  it('ShiftNotOpenError при закрытой смене', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder()
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    await prisma.shift.update({ where: { id: shift.id }, data: { status: 'CLOSED', closedAt: new Date(), closingCash: '0', expectedCash: '0', variance: '0' } })

    await expect(
      createReturn(prisma, {
        companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
        reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
        items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
      })
    ).rejects.toThrow(ShiftNotOpenError)
  })

  it('ExcessReturnQuantityError при превышении количества', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder({ quantity: '2' })
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })

    await expect(
      createReturn(prisma, {
        companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
        reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
        items: [{ orderItemId: orderItem.id, quantity: '3', unitRefundAmount: '100.00' }],
      })
    ).rejects.toThrow(ExcessReturnQuantityError)
  })
})

describe('applyReturn', () => {
  it('создаёт StockMovement.RETURN и увеличивает stock', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder({ quantity: '2' })
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'BRAK', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })

    await applyReturn(prisma, { returnId: ret.id })

    const movements = await prisma.stockMovement.findMany({ where: { type: 'RETURN', returnItem: { returnId: ret.id } } })
    expect(movements).toHaveLength(1)
    expect(Number(movements[0].quantity)).toBe(1)

    const sp = await prisma.storeProduct.findFirst({ where: { storeId: store.id, productId: orderItem.productId } })
    // After payOrder stock = -2, after return = -1
    expect(Number(sp?.stock)).toBe(-1)
  })

  it('реверсирует баллы при возврате (частичный)', async () => {
    const { company, store, order, cashier, shift, customer } = await makePaidOrder({ withCustomer: true, quantity: '1', basePrice: '1000.00' })
    // pointsEarned = floor(1000 * 0.01) = 10
    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updatedOrder.pointsEarned).toBe(10)

    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'REFUSAL', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '1000.00' }],
    })

    await applyReturn(prisma, { returnId: ret.id })

    const earnReversal = await prisma.pointsTransaction.findFirst({
      where: { returnId: ret.id, type: 'REFUND_EARN_REVERSAL' },
    })
    expect(earnReversal).not.toBeNull()
    expect(earnReversal?.amount).toBe(-10) // full reversal

    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer!.id } })
    expect(updatedCustomer.pointsBalance).toBe(0) // was 10, reversed -10
  })

  it('полный возврат всех позиций переводит заказ в REFUNDED', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder({ quantity: '2' })
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '2', unitRefundAmount: '100.00' }],
    })

    await applyReturn(prisma, { returnId: ret.id })

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updatedOrder.state).toBe('REFUNDED')
  })

  it('частичный возврат не переводит заказ в REFUNDED', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder({ quantity: '2' })
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })

    await applyReturn(prisma, { returnId: ret.id })

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updatedOrder.state).toBe('PAID')
  })

  it('ReturnStateError при повторном applyReturn', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder()
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })
    await applyReturn(prisma, { returnId: ret.id })

    await expect(applyReturn(prisma, { returnId: ret.id })).rejects.toThrow(ReturnStateError)
  })
})

describe('cancelReturn', () => {
  it('переводит DRAFT в CANCELLED', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder()
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })

    const cancelled = await cancelReturn(prisma, { returnId: ret.id })

    expect(cancelled.state).toBe('CANCELLED')
  })

  it('ReturnStateError при отмене не-DRAFT возврата', async () => {
    const { company, store, order, cashier, shift } = await makePaidOrder()
    const orderItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    const ret = await createReturn(prisma, {
      companyId: company.id, storeId: store.id, orderId: order.id, shiftId: shift.id,
      reasonCode: 'OTHER', refundMethod: 'CASH', createdByUserId: cashier.id,
      items: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '100.00' }],
    })
    await applyReturn(prisma, { returnId: ret.id })

    await expect(cancelReturn(prisma, { returnId: ret.id })).rejects.toThrow(ReturnStateError)
  })
})
