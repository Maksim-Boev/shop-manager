import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore, createTestUser } from '../helpers'

const setupBase = async () => {
  const company = await createTestCompany()
  const store = await createTestStore(company.id)
  const category = await createTestCategory(company.id)
  const product = await createTestProduct(company.id, category.id)
  const user = await createTestUser(company.id)
  return { company, store, category, product, user }
}

const makeManualAdj = async (companyId: string, storeId: string, productId: string, userId: string, qty: string) =>
  prisma.manualAdjustment.create({
    data: { companyId, storeId, productId, quantity: qty, reason: 'тест', createdByUserId: userId },
  })

describe('StockMovement schema', () => {
  it('MANUAL_ADJUST + manualAdjustmentId создаётся успешно', async () => {
    const { company, store, product, user } = await setupBase()
    const adj = await makeManualAdj(company.id, store.id, product.id, user.id, '5')
    const mv = await prisma.stockMovement.create({
      data: { companyId: company.id, storeId: store.id, productId: product.id, quantity: '5', type: 'MANUAL_ADJUST', manualAdjustmentId: adj.id },
    })
    expect(mv.type).toBe('MANUAL_ADJUST')
  })

  it('CHECK: ровно одна source-FK — нарушение при двух заполненных', async () => {
    const { company, store, product, user } = await setupBase()
    const adj = await makeManualAdj(company.id, store.id, product.id, user.id, '1')
    const audit = await prisma.inventoryAudit.create({
      data: { companyId: company.id, storeId: store.id, createdByUserId: user.id },
    })
    const auditItem = await prisma.inventoryAuditItem.create({
      data: { inventoryAuditId: audit.id, productId: product.id, expectedQty: '10', countedQty: '10', delta: '0' },
    })
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "StockMovement" (id, "companyId", "storeId", "productId", quantity, type, "manualAdjustmentId", "inventoryAuditItemId")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 5, 'MANUAL_ADJUST', $4, $5)`,
        company.id, store.id, product.id, adj.id, auditItem.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK: quantity != 0 запрещает нулевое движение', async () => {
    const { company, store, product, user } = await setupBase()
    const adj = await makeManualAdj(company.id, store.id, product.id, user.id, '0')
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "StockMovement" (id, "companyId", "storeId", "productId", quantity, type, "manualAdjustmentId")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 0, 'MANUAL_ADJUST', $4)`,
        company.id, store.id, product.id, adj.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK: знак quantity для SALE должен быть отрицательным', async () => {
    const { company, store, product, user } = await setupBase()
    const cashier = await createTestUser(company.id)
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
            originalUnitPrice: '100.00',
            taxRateSnapshot: '0.2000',
            quantity: '1',
            lineTotal: '100.00',
          }],
        },
      },
      include: { items: true },
    })
    const item = order.items[0]

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "StockMovement" (id, "companyId", "storeId", "productId", quantity, type, "orderItemId")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 5, 'SALE', $4)`,
        company.id, store.id, product.id, item.id,
      ),
    ).rejects.toThrow()

    const mv = await prisma.stockMovement.create({
      data: { companyId: company.id, storeId: store.id, productId: product.id, quantity: '-1', type: 'SALE', orderItemId: item.id },
    })
    expect(mv.quantity.toString()).toBe('-1')
  })

  it('CHECK: RECEIVE должен иметь положительный quantity', async () => {
    const { company, store, product, user } = await setupBase()
    const supplier = await prisma.supplier.create({ data: { companyId: company.id, name: 'Поставщик' } })
    const po = await prisma.purchaseOrder.create({
      data: {
        companyId: company.id,
        destinationStoreId: store.id,
        sourceType: 'SUPPLIER',
        supplierId: supplier.id,
        createdByUserId: user.id,
        items: { create: [{ productId: product.id, orderedQty: '10' }] },
      },
      include: { items: true },
    })
    const receipt = await prisma.goodsReceipt.create({
      data: {
        purchaseOrderId: po.id,
        receivedByUserId: user.id,
        items: { create: [{ purchaseOrderItemId: po.items[0].id, quantity: '10' }] },
      },
      include: { items: true },
    })
    const receiptItem = receipt.items[0]

    const mv = await prisma.stockMovement.create({
      data: { companyId: company.id, storeId: store.id, productId: product.id, quantity: '10', type: 'RECEIVE', goodsReceiptItemId: receiptItem.id },
    })
    expect(mv.type).toBe('RECEIVE')
  })
})
