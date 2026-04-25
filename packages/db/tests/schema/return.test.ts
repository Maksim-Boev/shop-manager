import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore, createTestUser } from '../helpers'

const setupOrderWithItem = async () => {
  const company = await createTestCompany()
  const store = await createTestStore(company.id)
  const category = await createTestCategory(company.id)
  const product = await createTestProduct(company.id, category.id, { basePrice: '200.00' })
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
          originalUnitPrice: '200.00',
          taxRateSnapshot: '0.2000',
          quantity: '3',
          lineTotal: '600.00',
        }],
      },
    },
    include: { items: true },
  })

  const shift = await prisma.shift.create({
    data: { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' },
  })

  return { company, store, order, shift, orderItem: order.items[0], cashier }
}

describe('Return / ReturnItem schema', () => {
  it('создаёт Return с ReturnItem', async () => {
    const { company, store, order, shift, orderItem, cashier } = await setupOrderWithItem()

    const ret = await prisma.return.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderId: order.id,
        shiftId: shift.id,
        reasonCode: 'NOT_FIT',
        refundMethod: 'CASH',
        refundAmount: '200.00',
        createdByUserId: cashier.id,
        items: {
          create: [{ orderItemId: orderItem.id, quantity: '1', unitRefundAmount: '200.00', refundSubtotal: '200.00' }],
        },
      },
      include: { items: true },
    })
    expect(ret.state).toBe('DRAFT')
    expect(ret.items).toHaveLength(1)
  })

  it('CHECK return_applied_at_match: APPLIED требует appliedAt', async () => {
    const { company, store, order, shift, cashier } = await setupOrderWithItem()

    const ret = await prisma.return.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderId: order.id,
        shiftId: shift.id,
        reasonCode: 'REFUSAL',
        refundMethod: 'CARD',
        refundAmount: '200.00',
        createdByUserId: cashier.id,
      },
    })

    await expect(
      prisma.$executeRawUnsafe(`UPDATE "Return" SET state = 'APPLIED' WHERE id = $1`, ret.id),
    ).rejects.toThrow()
  })

  it('CHECK return_refund_nonneg: отрицательный refundAmount запрещён', async () => {
    const { company, store, order, shift, cashier } = await setupOrderWithItem()

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Return" (id, "companyId", "storeId", "orderId", "shiftId", state, "reasonCode", "refundMethod", "refundAmount", "createdByUserId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'DRAFT', 'OTHER', 'CASH', -1, $5, now())`,
        company.id, store.id, order.id, shift.id, cashier.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK return_item_quantity_positive: quantity <= 0 запрещён', async () => {
    const { company, store, order, shift, orderItem, cashier } = await setupOrderWithItem()

    const ret = await prisma.return.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderId: order.id,
        shiftId: shift.id,
        reasonCode: 'BRAK',
        refundMethod: 'CASH',
        refundAmount: '200.00',
        createdByUserId: cashier.id,
      },
    })

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "ReturnItem" (id, "returnId", "orderItemId", quantity, "unitRefundAmount", "refundSubtotal")
         VALUES (gen_random_uuid()::text, $1, $2, 0, 200, 0)`,
        ret.id, orderItem.id,
      ),
    ).rejects.toThrow()
  })

  it('Return переходит в APPLIED с appliedAt', async () => {
    const { company, store, order, shift, orderItem, cashier } = await setupOrderWithItem()

    const ret = await prisma.return.create({
      data: {
        companyId: company.id,
        storeId: store.id,
        orderId: order.id,
        shiftId: shift.id,
        reasonCode: 'OTHER',
        refundMethod: 'MANUAL',
        refundAmount: '0',
        createdByUserId: cashier.id,
      },
    })

    const applied = await prisma.return.update({
      where: { id: ret.id },
      data: { state: 'APPLIED', appliedAt: new Date() },
    })
    expect(applied.state).toBe('APPLIED')
    expect(applied.appliedAt).not.toBeNull()
  })
})
