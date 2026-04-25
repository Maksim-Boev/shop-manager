import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore, createTestUser } from '../helpers'

const makeOrder = async (companyId: string, storeId: string, cashierId: string, orderNumber: number) =>
  prisma.order.create({
    data: { companyId, storeId, orderNumber, cashierUserId: cashierId },
  })

describe('order schema', () => {
  it('Order создаётся со снэпшотами товара в OrderItem', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '199.00' })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const order = await prisma.order.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderNumber: 1,
        cashierUserId: cashier.id,
        items: {
          create: [{
            productId: product.id,
            productNameSnapshot: product.name,
            unitSnapshot: 'PIECE',
            originalUnitPrice: '199.00',
            taxRateSnapshot: '0.2000',
            quantity: '2',
            lineTotal: '398.00',
          }],
        },
      },
      include: { items: true },
    })
    expect(order.items[0].productNameSnapshot).toBe(product.name)
    expect(order.items[0].originalUnitPrice.toString()).toBe('199')
  })

  it('CHECK order_payment_coherence: частично заполненные поля оплаты запрещены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)
    const order = await makeOrder(company.id, store.id, cashier.id, 2)

    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE "Order" SET "paymentMethod" = 'CASH', "paidAt" = now() WHERE id = $1`,
        order.id,
      ),
    ).rejects.toThrow()
  })

  it('оплата принимается когда все три поля заполнены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)
    const order = await makeOrder(company.id, store.id, cashier.id, 3)

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod: 'CASH', paidAmount: '500.00', paidAt: new Date() },
    })
    expect(updated.paymentMethod).toBe('CASH')
  })

  it('CHECK order_item_quantity_positive: quantity <= 0 запрещён', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    const cashier = await createTestUser(company.id)
    const order = await makeOrder(company.id, store.id, cashier.id, 4)

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "OrderItem" (id, "orderId", "productId", "productNameSnapshot", "unitSnapshot", "originalUnitPrice", "taxRateSnapshot", quantity, "discountTotal", "lineTotal")
         VALUES (gen_random_uuid()::text, $1, $2, 'X', 'PIECE', 10, 0.2, 0, 0, 0)`,
        order.id, product.id,
      ),
    ).rejects.toThrow()
  })

  it('unique (storeId, orderNumber)', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)

    await makeOrder(company.id, store.id, cashier.id, 100)
    await expect(makeOrder(company.id, store.id, cashier.id, 100)).rejects.toMatchObject({ code: 'P2002' })
  })

  it('OrderItemDiscount — запись о применённой скидке', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })
    const cashier = await createTestUser(company.id)

    const order = await prisma.order.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderNumber: 200,
        cashierUserId: cashier.id,
        items: {
          create: [{
            productId: product.id,
            productNameSnapshot: product.name,
            unitSnapshot: 'PIECE',
            originalUnitPrice: '100.00',
            taxRateSnapshot: '0.2000',
            quantity: '1',
            lineTotal: '90.00',
            discountTotal: '10.00',
          }],
        },
      },
      include: { items: true },
    })
    const discount = await prisma.orderItemDiscount.create({
      data: {
        orderItemId: order.items[0].id,
        sourceType: 'PROMOTION',
        sourceId: 'promo-id-fake',
        appliedPercent: '0.1000',
        appliedAmount: '10.00',
      },
    })
    expect(discount.sourceType).toBe('PROMOTION')
  })
})
