import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct } from '../helpers'

const seedTax = async (companyId: string) =>
  prisma.taxRate.create({ data: { companyId, name: 'НДС 20%', rate: '0.2000', isDefault: true } })

describe('catalog schema', () => {
  it('partial unique SKU: нельзя создать дубль, можно после архивации', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const tax = await seedTax(company.id)
    const base = { companyId: company.id, categoryId: category.id, taxRateId: tax.id, sku: 'MILK-1L', name: 'Молоко', unit: 'LITER' as const, basePrice: '59.90' }

    const p1 = await prisma.product.create({ data: base })
    await expect(prisma.product.create({ data: base })).rejects.toThrow()

    await prisma.product.update({ where: { id: p1.id }, data: { status: 'ARCHIVED' } })
    const p2 = await prisma.product.create({ data: base })
    expect(p2.id).not.toBe(p1.id)
  })

  it('несколько штрихкодов на товар, partial unique среди активных', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const tax = await seedTax(company.id)
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        taxRateId: tax.id,
        sku: 'X1',
        name: 'X',
        unit: 'PIECE',
        basePrice: '10.00',
        barcodes: { create: [{ barcode: '111', isPrimary: true }, { barcode: '222' }] },
      },
      include: { barcodes: true },
    })
    expect(product.barcodes).toHaveLength(2)

    await expect(prisma.productBarcode.create({ data: { productId: product.id, barcode: '111' } })).rejects.toThrow()

    await prisma.productBarcode.updateMany({ where: { productId: product.id, barcode: '111' }, data: { isActive: false } })
    const reused = await prisma.productBarcode.create({ data: { productId: product.id, barcode: '111' } })
    expect(reused.isActive).toBe(true)
  })

  it('Tag уникален по (companyId, name)', async () => {
    const company = await createTestCompany()
    await prisma.tag.create({ data: { companyId: company.id, name: 'акция' } })
    await expect(prisma.tag.create({ data: { companyId: company.id, name: 'акция' } })).rejects.toMatchObject({ code: 'P2002' })
  })

  it('Subcategory — двухуровневая иерархия', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id, 'Напитки')
    const sub = await prisma.subcategory.create({ data: { categoryId: category.id, name: 'Соки' } })
    const tax = await seedTax(company.id)
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        subcategoryId: sub.id,
        taxRateId: tax.id,
        sku: 'JUICE-1',
        name: 'Сок',
        unit: 'LITER',
        basePrice: '89.00',
      },
    })
    expect(product.subcategoryId).toBe(sub.id)
  })

  it('Product.tags — M:N через ProductTag', async () => {
    const company = await createTestCompany()
    const category = await createTestCategory(company.id)
    const tax = await seedTax(company.id)
    const [tag1, tag2] = await Promise.all([
      prisma.tag.create({ data: { companyId: company.id, name: 'хит' } }),
      prisma.tag.create({ data: { companyId: company.id, name: 'новинка' } }),
    ])
    const product = await createTestProduct(company.id, category.id, { sku: 'PROD-TAG' })
    await prisma.productTag.createMany({ data: [{ productId: product.id, tagId: tag1.id }, { productId: product.id, tagId: tag2.id }] })
    const loaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { tags: true } })
    expect(loaded.tags).toHaveLength(2)
  })
})
