import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  cleanupTestCompanies,
  createTestCategory,
  createTestCompany,
  createTestCustomer,
  createTestProduct,
  createTestPromotion,
  createTestStore,
  createTestTier,
  createTestUser,
} from '../helpers'
import { addOrderItem, confirmOrder, createOrder, payOrder } from '../../lib/services/order'
import { applyDiscounts } from '../../lib/services/discount'
import { InsufficientPointsError, OrderStateError } from '../../lib/services/errors'
import { openShift } from '../../lib/services/shift'

afterEach(cleanupTestCompanies)

const makeOrderWithItem = async (opts: { basePrice?: string; quantity?: string } = {}) => {
  const company = await createTestCompany()
  const store = await createTestStore(company.id)
  const cashier = await createTestUser(company.id, { role: 'CASHIER' })
  const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
  const category = await createTestCategory(company.id)
  const product = await createTestProduct(company.id, category.id, { basePrice: opts.basePrice ?? '100.00' })
  const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id })
  await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: opts.quantity ?? '2' })
  return { company, store, cashier, shift, order, product, category }
}

describe('applyDiscounts — PERCENT promotion', () => {
  it('применяет PERCENT-акцию ко всем позициям', async () => {
    const { company, store, order } = await makeOrderWithItem({ basePrice: '100.00', quantity: '2' })
    await createTestPromotion(company.id, store.id, { actionType: 'PERCENT', actionValue: '10', targetType: 'ALL' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    // gross = 200, 10% = 20 discount
    expect(Number(updated.discountTotal)).toBe(20)
    expect(Number(updated.grandTotal)).toBe(180)

    const discount = await prisma.orderItemDiscount.findFirst({ where: { orderItem: { orderId: order.id } } })
    expect(discount?.sourceType).toBe('PROMOTION')
    expect(Number(discount?.appliedAmount)).toBe(20)
  })

  it('caps promotion at maxPromotionPercent', async () => {
    // maxPromotionPercent = 50 in helper, promo is 80%
    const { company, store, order } = await makeOrderWithItem({ basePrice: '100.00', quantity: '1' })
    await createTestPromotion(company.id, store.id, { actionType: 'PERCENT', actionValue: '80', targetType: 'ALL' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    // cap = min(80%, maxPromotionPercent=50%) = 50
    expect(Number(updated.discountTotal)).toBe(50)
  })

  it('re-entrant: повторный вызов даёт тот же результат', async () => {
    const { company, store, order } = await makeOrderWithItem({ basePrice: '200.00', quantity: '1' })
    await createTestPromotion(company.id, store.id, { actionType: 'PERCENT', actionValue: '10' })

    await applyDiscounts(prisma, { orderId: order.id })
    const second = await applyDiscounts(prisma, { orderId: order.id })

    expect(Number(second.discountTotal)).toBe(20)
    const discounts = await prisma.orderItemDiscount.findMany({ where: { orderItem: { orderId: order.id } } })
    // Exactly one discount record (not duplicated)
    expect(discounts).toHaveLength(1)
  })
})

describe('applyDiscounts — FIXED_AMOUNT promotion', () => {
  it('применяет фиксированную скидку', async () => {
    const { company, store, order } = await makeOrderWithItem({ basePrice: '100.00', quantity: '1' })
    await createTestPromotion(company.id, store.id, { actionType: 'FIXED_AMOUNT', actionValue: '15' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    expect(Number(updated.discountTotal)).toBe(15)
  })

  it('FIXED_AMOUNT не превышает gross', async () => {
    const { company, store, order } = await makeOrderWithItem({ basePrice: '10.00', quantity: '1' })
    await createTestPromotion(company.id, store.id, { actionType: 'FIXED_AMOUNT', actionValue: '100' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    expect(Number(updated.discountTotal)).toBe(10) // capped at gross
  })
})

describe('applyDiscounts — BOGO promotion', () => {
  it('split: buy 2 get 1 at 100% off из 3 шт', async () => {
    const { company, store, order, product } = await makeOrderWithItem({ basePrice: '100.00', quantity: '3' })
    await createTestPromotion(company.id, store.id, {
      actionType: 'BOGO',
      actionValue: '0',
      bogoTriggerQty: 2,
      bogoGetQty: 1,
      bogoGetDiscountPercent: '100',
      targetType: 'PRODUCT',
      targetId: product.id,
    })

    await applyDiscounts(prisma, { orderId: order.id })

    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
    // Must have 2 items: trigger (qty=2) and prize (qty=1)
    expect(items).toHaveLength(2)
    const prizeItem = items.find(i => i.sourcePromotionId !== null)
    expect(prizeItem).toBeDefined()
    expect(Number(prizeItem!.quantity)).toBe(1)
    expect(Number(prizeItem!.discountTotal)).toBe(100) // 1 * 100 * 100%

    const triggerItem = items.find(i => i.sourcePromotionId === null)
    expect(Number(triggerItem!.quantity)).toBe(2)
    expect(Number(triggerItem!.discountTotal)).toBe(0)

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(Number(updatedOrder.grandTotal)).toBe(200) // 2 * 100
  })

  it('повторный applyDiscounts не дублирует split', async () => {
    const { company, store, order, product } = await makeOrderWithItem({ basePrice: '100.00', quantity: '3' })
    await createTestPromotion(company.id, store.id, {
      actionType: 'BOGO', actionValue: '0',
      bogoTriggerQty: 2, bogoGetQty: 1, bogoGetDiscountPercent: '100',
      targetType: 'PRODUCT', targetId: product.id,
    })

    await applyDiscounts(prisma, { orderId: order.id })
    await applyDiscounts(prisma, { orderId: order.id })

    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(items).toHaveLength(2)
  })
})

describe('applyDiscounts — Tier rule', () => {
  it('применяет скидку тира к позиции', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const tier = await createTestTier(company.id, { level: 1 })
    await prisma.tierRule.create({ data: { tierId: tier.id, scope: 'WHOLE_ORDER', discountPercent: '20' } })
    const customer = await createTestCustomer(company.id)
    await prisma.customer.update({ where: { id: customer.id }, data: { tierId: tier.id } })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    expect(Number(updated.discountTotal)).toBe(20)
    const discount = await prisma.orderItemDiscount.findFirst({ where: { orderItem: { orderId: order.id } } })
    expect(discount?.sourceType).toBe('TIER')
  })

  it('CustomerDiscountRule с более специфичным scope побеждает TierRule', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const tier = await createTestTier(company.id, { level: 1 })
    await prisma.tierRule.create({ data: { tierId: tier.id, scope: 'WHOLE_ORDER', discountPercent: '10' } })
    const customer = await createTestCustomer(company.id)
    await prisma.customer.update({ where: { id: customer.id }, data: { tierId: tier.id } })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    await prisma.customerDiscountRule.create({
      data: { customerId: customer.id, scope: 'PRODUCT', targetId: product.id, discountPercent: '25' },
    })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    // PRODUCT > WHOLE_ORDER → customer rule 25% wins
    expect(Number(updated.discountTotal)).toBe(25)
    const discount = await prisma.orderItemDiscount.findFirst({ where: { orderItem: { orderId: order.id } } })
    expect(discount?.sourceType).toBe('CUSTOMER_RULE')
  })

  it('нет скидок лояльности без клиента', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const tier = await createTestTier(company.id, { level: 1 })
    await prisma.tierRule.create({ data: { tierId: tier.id, scope: 'WHOLE_ORDER', discountPercent: '20' } })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    // Order without customer
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    expect(Number(updated.discountTotal)).toBe(0)
  })
})

describe('applyDiscounts — POINTS', () => {
  it('распределяет баллы пропорционально по позициям (Hare)', async () => {
    const company = await createTestCompany() // pointsRedemptionRate = 0.01
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id)
    await prisma.customer.update({ where: { id: customer.id }, data: { pointsBalance: 1000 } })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    // 200 points * 0.01 = 2 currency discount
    const updated = await applyDiscounts(prisma, { orderId: order.id, pointsToRedeem: 200 })

    expect(Number(updated.discountTotal)).toBe(2)
    const discount = await prisma.orderItemDiscount.findFirst({ where: { orderItem: { orderId: order.id }, sourceType: 'POINTS' } })
    expect(discount).not.toBeNull()
  })

  it('InsufficientPointsError при нехватке баллов', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id) // balance = 0
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    await expect(
      applyDiscounts(prisma, { orderId: order.id, pointsToRedeem: 100 })
    ).rejects.toThrow(InsufficientPointsError)
  })
})

describe('applyDiscounts — global cap', () => {
  it('суммарная скидка не превышает maxTotalDiscountPercent', async () => {
    // Company: maxPromotionPercent=50, maxTierPercent=30, maxTotalDiscountPercent=70
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id)
    const tier = await createTestTier(company.id, { level: 1 })
    await prisma.tierRule.create({ data: { tierId: tier.id, scope: 'WHOLE_ORDER', discountPercent: '30' } })
    await prisma.customer.update({ where: { id: customer.id }, data: { tierId: tier.id } })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    // Promotion 50% + Tier 30% = 80%, but global cap is 70%
    await createTestPromotion(company.id, store.id, { actionType: 'PERCENT', actionValue: '50' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const updated = await applyDiscounts(prisma, { orderId: order.id })

    // Promo takes 50 (hits promoMax=50). Remaining global headroom = 70-50 = 20. Tier gets min(30, 20) = 20.
    expect(Number(updated.discountTotal)).toBe(70)
  })
})

describe('applyDiscounts — intégration с confirmOrder / payOrder', () => {
  it('confirmOrder применяет скидки и они отражаются в grandTotal', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    await createTestPromotion(company.id, store.id, { actionType: 'PERCENT', actionValue: '10' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    const confirmed = await confirmOrder(prisma, { orderId: order.id })

    expect(Number(confirmed.grandTotal)).toBe(90)
  })

  it('payOrder с pointsToRedeem учитывает скидку баллами в grandTotal', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const customer = await createTestCustomer(company.id)
    await prisma.customer.update({ where: { id: customer.id }, data: { pointsBalance: 1000 } })
    const shift = await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const order = await createOrder(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, shiftId: shift.id, customerId: customer.id })
    await addOrderItem(prisma, { orderId: order.id, productId: product.id, quantity: '1' })

    // 500 points * 0.01 = 5 discount → grandTotal = 95
    const paid = await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '95.00', pointsToRedeem: 500 })

    expect(paid.state).toBe('PAID')
    expect(Number(paid.grandTotal)).toBe(95)
  })

  it('OrderStateError при applyDiscounts на PAID заказ', async () => {
    const { order } = await makeOrderWithItem()
    await payOrder(prisma, { orderId: order.id, paymentMethod: 'CASH', paidAmount: '200.00' })

    await expect(applyDiscounts(prisma, { orderId: order.id })).rejects.toThrow(OrderStateError)
  })
})
