import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestCustomer, createTestProduct, createTestStore, createTestUser } from '../helpers'
import { addOrderItem, cancelOrder, confirmOrder, createOrder, fulfillOrder, payOrder, removeOrderItem, updateOrderItemQty } from '../../lib/services/order'
import { InsufficientPointsError, OrderStateError, ProductNotAvailableError, ShiftNotOpenError, ShopError } from '../../lib/services/errors'
import { openShift } from '../../lib/services/shift'

describe('createOrder', () => {
  it('создаёт заказ со state=DRAFT и корректным orderNumber', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })

    const order = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id,
    })

    expect(order.state).toBe('DRAFT')
    expect(order.orderNumber).toBe(1)
    expect(order.grandTotal.toString()).toBe('0')
  })

  it('orderNumber инкрементируется per-store', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })

    const order1 = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id,
    })
    const order2 = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id,
    })

    expect(order2.orderNumber).toBe(order1.orderNumber + 1)
  })

  it('ShiftNotOpenError для закрытой смены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    await prisma.shift.update({ where: { id: shift.id }, data: { status: 'CLOSED', closedAt: new Date(), closingCash: '0', expectedCash: '0', variance: '0' } })

    await expect(
      createOrder(prisma, {
        companyId: company.id, storeId: store.id,
        cashierUserId: cashier.id, shiftId: shift.id,
      })
    ).rejects.toThrow(ShiftNotOpenError)
  })

  it('ShopError если кассир не совпадает со сменой', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier1 = await createTestUser(company.id, { role: 'CASHIER' })
    const cashier2 = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier1.id, openingCash: '0',
    })

    await expect(
      createOrder(prisma, {
        companyId: company.id, storeId: store.id,
        cashierUserId: cashier2.id, shiftId: shift.id,
      })
    ).rejects.toThrow(ShopError)
  })
})

const makeTestOrder = async () => {
  const company = await createTestCompany()
  const store = await createTestStore(company.id)
  const cashier = await createTestUser(company.id, { role: 'CASHIER' })
  const shift = await openShift(prisma, {
    companyId: company.id, storeId: store.id,
    cashierUserId: cashier.id, openingCash: '0',
  })
  const order = await createOrder(prisma, {
    companyId: company.id, storeId: store.id,
    cashierUserId: cashier.id, shiftId: shift.id,
  })
  return { company, store, cashier, shift, order }
}

describe('addOrderItem', () => {
  it('добавляет позицию, заполняет снэпшоты, обновляет grandTotal', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '200.00' })

    const item = await addOrderItem(prisma, {
      orderId: order.id, productId: product.id, quantity: '2',
    })

    expect(item.productNameSnapshot).toBe(product.name)
    expect(item.originalUnitPrice.toString()).toBe('200')
    expect(item.lineTotal.toString()).toBe('400')

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.grandTotal.toString()).toBe('400')
  })

  it('ProductNotAvailableError для архивного товара', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    await prisma.product.update({ where: { id: product.id }, data: { status: 'ARCHIVED' } })

    await expect(
      addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    ).rejects.toThrow(ProductNotAvailableError)
  })

  it('OrderStateError при добавлении в не-DRAFT заказ', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    await prisma.order.update({ where: { id: order.id }, data: { state: 'PENDING' } })

    await expect(
      addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    ).rejects.toThrow(OrderStateError)
  })
})

describe('removeOrderItem', () => {
  it('удаляет позицию и пересчитывает итоги заказа', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const item = await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '3' })

    await removeOrderItem(prisma, { orderItemId: item.id })

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.grandTotal.toString()).toBe('0')
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(items).toHaveLength(0)
  })

  it('OrderStateError при удалении позиции из не-DRAFT заказа', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    const item = await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await confirmOrder(prisma, { orderId: order.id })

    await expect(
      removeOrderItem(prisma, { orderItemId: item.id })
    ).rejects.toThrow(OrderStateError)
  })
})

describe('updateOrderItemQty', () => {
  it('обновляет quantity и lineTotal, пересчитывает заказ', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '50.00' })
    const item = await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const updated = await updateOrderItemQty(prisma, { orderItemId: item.id, quantity: '4' })

    expect(updated.quantity.toString()).toBe('4')
    expect(updated.lineTotal.toString()).toBe('200')
    const orderUpdated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(orderUpdated.grandTotal.toString()).toBe('200')
  })

  it('ShopError при quantity <= 0', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    const item = await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    await expect(
      updateOrderItemQty(prisma, { orderItemId: item.id, quantity: '0' })
    ).rejects.toThrow(ShopError)
  })
})

describe('confirmOrder', () => {
  it('переводит заказ в PENDING и фиксирует актуальные снэпшоты', async () => {
    const { company, store, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '2' })

    // Меняем цену после добавления в заказ
    await prisma.product.update({ where: { id: product.id }, data: { basePrice: '150.00' } })

    const confirmed = await confirmOrder(prisma, { orderId: order.id })

    expect(confirmed.state).toBe('PENDING')
    // Снэпшот обновлён до новой цены
    const item = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    expect(item.originalUnitPrice.toString()).toBe('150')
    expect(item.lineTotal.toString()).toBe('300')
    expect(confirmed.grandTotal.toString()).toBe('300')
  })

  it('ShopError для пустого заказа', async () => {
    const { order } = await makeTestOrder()

    await expect(confirmOrder(prisma, { orderId: order.id }))
      .rejects.toThrow(ShopError)
  })

  it('OrderStateError если заказ не в DRAFT', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await confirmOrder(prisma, { orderId: order.id })

    await expect(confirmOrder(prisma, { orderId: order.id }))
      .rejects.toThrow(OrderStateError)
  })
})

describe('payOrder — stock movements', () => {
  it('создаёт StockMovement.SALE и уменьшает StoreProduct.stock', async () => {
    const { company, store, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '3' })
    await confirmOrder(prisma, { orderId: order.id })

    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '300.00' })

    const movements = await prisma.stockMovement.findMany({
      where: { orderItem: { orderId: order.id } },
    })
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('SALE')
    expect(Number(movements[0].quantity)).toBe(-3)

    const sp = await prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId: store.id, productId: product.id } },
    })
    expect(Number(sp?.stock)).toBe(-3)
  })

  it('переводит заказ из DRAFT в PAID напрямую (без confirmOrder)', async () => {
    const { company, store, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '50.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '2' })

    const paid = await payOrder(prisma, { orderId: order.id, paymentMethod: 'CARD', paidAmount: '100.00' })

    expect(paid.state).toBe('PAID')
    // Снэпшоты зафиксированы
    const item = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
    expect(item.originalUnitPrice.toString()).toBe('50')
  })

  it('ShopError если paidAmount меньше grandTotal', async () => {
    const { company, store, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await confirmOrder(prisma, { orderId: order.id })

    await expect(
      payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '50.00' })
    ).rejects.toThrow(ShopError)
  })

  it('OrderStateError если заказ уже PAID', async () => {
    const { company, store, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '10.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '10.00' })

    await expect(
      payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '10.00' })
    ).rejects.toThrow(OrderStateError)
  })
})

describe('payOrder — points', () => {
  it('начисляет EARN-транзакцию и обновляет Customer.pointsBalance', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id)
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    const order = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id,
    })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '1000.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    // pointsEarnPercent = 0.01 => floor(1000 * 0.01) = 10 баллов
    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '1000.00' })

    const earn = await prisma.pointsTransaction.findFirst({
      where: { orderId: order.id, type: 'EARN' },
    })
    expect(earn).not.toBeNull()
    expect(earn?.amount).toBe(10)

    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })
    expect(updatedCustomer.pointsBalance).toBe(10)
    expect(Number(updatedCustomer.totalSpent)).toBe(1000)
  })

  it('списывает баллы (SPEND) и начисляет EARN', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id)
    // Дать клиенту стартовый баланс
    await prisma.customer.update({ where: { id: customer.id }, data: { pointsBalance: 500 } })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    const order = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id,
    })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    await payOrder(prisma, {
      orderId: order.id, paymentMethod: 'CASH', paidAmount: '100.00', pointsToRedeem: 200,
    })

    const spend = await prisma.pointsTransaction.findFirst({ where: { orderId: order.id, type: 'SPEND' } })
    expect(spend?.amount).toBe(-200)

    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })
    // 500 - 200 + floor(100 * 0.01) = 301
    expect(updatedCustomer.pointsBalance).toBe(301)
  })

  it('InsufficientPointsError если баллов не хватает', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id) // pointsBalance = 0
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    const order = await createOrder(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id,
    })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '50.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    await expect(
      payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '50.00', pointsToRedeem: 100 })
    ).rejects.toThrow(InsufficientPointsError)
  })
})

describe('fulfillOrder', () => {
  it('переводит PAID в FULFILLED без побочных эффектов', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '10.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '10.00' })

    const fulfilled = await fulfillOrder(prisma, { orderId: order.id })

    expect(fulfilled.state).toBe('FULFILLED')
    const movements = await prisma.stockMovement.findMany({ where: { orderItem: { orderId: order.id } } })
    expect(movements).toHaveLength(1) // только SALE из payOrder, новых нет
  })

  it('OrderStateError если заказ не в PAID', async () => {
    const { order } = await makeTestOrder()

    await expect(fulfillOrder(prisma, { orderId: order.id })).rejects.toThrow(OrderStateError)
  })
})

describe('cancelOrder', () => {
  it('отменяет DRAFT-заказ без StockMovement', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '50.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const cancelled = await cancelOrder(prisma, { orderId: order.id })

    expect(cancelled.state).toBe('CANCELLED')
    const movements = await prisma.stockMovement.findMany({ where: { orderItem: { orderId: order.id } } })
    expect(movements).toHaveLength(0)
  })

  it('отменяет PENDING-заказ', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await confirmOrder(prisma, { orderId: order.id })

    const cancelled = await cancelOrder(prisma, { orderId: order.id })
    expect(cancelled.state).toBe('CANCELLED')
  })

  it('OrderStateError если заказ уже PAID', async () => {
    const { company, order } = await makeTestOrder()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '10.00' })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })
    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '10.00' })

    await expect(cancelOrder(prisma, { orderId: order.id })).rejects.toThrow(OrderStateError)
  })
})
