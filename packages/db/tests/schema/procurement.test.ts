import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore, createTestUser } from '../helpers'

describe('procurement schema', () => {
  it('PurchaseOrder с SUPPLIER требует supplierId', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const user = await createTestUser(company.id)
    const supplier = await prisma.supplier.create({ data: { companyId: company.id, name: 'ООО Поставки' } })

    const po = await prisma.purchaseOrder.create({
      data: { companyId: company.id, destinationStoreId: store.id, sourceType: 'SUPPLIER', supplierId: supplier.id, createdByUserId: user.id },
    })
    expect(po.sourceType).toBe('SUPPLIER')
    expect(po.supplierId).toBe(supplier.id)
  })

  it('CHECK po_source_type_match: SUPPLIER без supplierId запрещён', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const user = await createTestUser(company.id)

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "PurchaseOrder" (id, "companyId", "destinationStoreId", "sourceType", "createdByUserId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'SUPPLIER', $3, now())`,
        company.id, store.id, user.id,
      ),
    ).rejects.toThrow()
  })

  it('PurchaseOrder с ANY_SUPPLIER не требует ни supplierId ни sourceWarehouseId', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const user = await createTestUser(company.id)

    const po = await prisma.purchaseOrder.create({
      data: { companyId: company.id, destinationStoreId: store.id, sourceType: 'ANY_SUPPLIER', createdByUserId: user.id },
    })
    expect(po.supplierId).toBeNull()
    expect(po.sourceWarehouseId).toBeNull()
  })

  it('PurchaseOrder с WAREHOUSE требует sourceWarehouseId', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const wh = await createTestStore(company.id, { type: 'WAREHOUSE', name: 'Склад' })
    const user = await createTestUser(company.id)

    const po = await prisma.purchaseOrder.create({
      data: { companyId: company.id, destinationStoreId: store.id, sourceType: 'WAREHOUSE', sourceWarehouseId: wh.id, createdByUserId: user.id },
    })
    expect(po.sourceWarehouseId).toBe(wh.id)
  })

  it('GoodsReceipt — частичная приёмка по позициям PO', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)
    const user = await createTestUser(company.id)
    const supplier = await prisma.supplier.create({ data: { companyId: company.id, name: 'S' } })

    const po = await prisma.purchaseOrder.create({
      data: {
        companyId: company.id,
        destinationStoreId: store.id,
        sourceType: 'SUPPLIER',
        supplierId: supplier.id,
        createdByUserId: user.id,
        items: { create: [{ productId: product.id, orderedQty: '100' }] },
      },
      include: { items: true },
    })

    const receipt = await prisma.goodsReceipt.create({
      data: {
        purchaseOrderId: po.id,
        receivedByUserId: user.id,
        items: { create: [{ purchaseOrderItemId: po.items[0].id, quantity: '40' }] },
      },
      include: { items: true },
    })
    expect(receipt.items[0].quantity.toString()).toBe('40')
  })
})
