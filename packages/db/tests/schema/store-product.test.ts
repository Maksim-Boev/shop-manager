import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestProduct, createTestStore } from '../helpers'

describe('StoreProduct schema', () => {
  it('создаёт StoreProduct с override цены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)

    const sp = await prisma.storeProduct.create({
      data: { storeId: store.id, productId: product.id, priceOverride: '89.00' },
    })
    expect(sp.priceOverride?.toString()).toBe('89')
    expect(sp.isAvailable).toBe(true)
    expect(sp.stock.toString()).toBe('0')
  })

  it('уникален по (storeId, productId)', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)

    await prisma.storeProduct.create({ data: { storeId: store.id, productId: product.id } })
    await expect(
      prisma.storeProduct.create({ data: { storeId: store.id, productId: product.id } }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('прокидывает priceOverride null (убираем override)', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const category = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, category.id)

    const sp = await prisma.storeProduct.create({ data: { storeId: store.id, productId: product.id, priceOverride: '120.00' } })
    const updated = await prisma.storeProduct.update({ where: { id: sp.id }, data: { priceOverride: null } })
    expect(updated.priceOverride).toBeNull()
  })
})
