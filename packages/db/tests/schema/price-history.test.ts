import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore, createTestTaxRate } from '../helpers'

describe('PriceHistory триггеры', () => {
  it('триггер пишет запись при изменении Product.basePrice', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })

    await prisma.product.update({ where: { id: product.id }, data: { basePrice: '120.00' } })

    const history = await prisma.priceHistory.findMany({ where: { productId: product.id, storeId: null } })
    expect(history).toHaveLength(1)
    expect(history[0].oldPrice.toString()).toBe('100')
    expect(history[0].newPrice.toString()).toBe('120')
  })

  it('триггер не пишет запись если basePrice не изменился', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })

    await prisma.product.update({ where: { id: product.id }, data: { name: 'Новое название' } })

    const history = await prisma.priceHistory.findMany({ where: { productId: product.id } })
    expect(history).toHaveLength(0)
  })

  it('триггер пишет запись при изменении StoreProduct.priceOverride', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id, { basePrice: '100.00' })

    const sp = await prisma.storeProduct.create({ data: { storeId: store.id, productId: product.id } })
    await prisma.storeProduct.update({ where: { id: sp.id }, data: { priceOverride: '95.00' } })

    const history = await prisma.priceHistory.findMany({ where: { productId: product.id, storeId: store.id } })
    expect(history).toHaveLength(1)
    expect(history[0].oldPrice.toString()).toBe('0')
    expect(history[0].newPrice.toString()).toBe('95')
  })

  it('триггер sync_barcode_is_active: архивация товара деактивирует штрихкоды', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const tax = await createTestTaxRate(company.id)
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        taxRateId: tax.id,
        sku: 'BC-SYNC',
        name: 'Barcode Sync Test',
        unit: 'PIECE',
        basePrice: '10.00',
        barcodes: { create: [{ barcode: 'BC001', isPrimary: true }] },
      },
    })

    await prisma.product.update({ where: { id: product.id }, data: { status: 'ARCHIVED' } })

    const barcode = await prisma.productBarcode.findFirst({ where: { productId: product.id } })
    expect(barcode?.isActive).toBe(false)
  })
})
