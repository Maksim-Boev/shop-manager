import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestTaxRate,
} from '../helpers'
import { getShopsWithStats } from '../../lib/queries/shops'

describe('getShopsWithStats — margin', () => {
  let companyId: string
  let shopId: string
  let cashierId: string
  let categoryId: string
  let taxRateId: string

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
    const shop = await createTestStore(companyId, { type: 'SHOP' })
    shopId = shop.id
    const cashier = await createTestUser(companyId, { role: 'CASHIER' })
    cashierId = cashier.id
    const cat = await createTestCategory(companyId)
    categoryId = cat.id
    const tax = await createTestTaxRate(companyId)
    taxRateId = tax.id
  })

  const createPaidOrder = async (
    items: Array<{ productId: string; qty: number; unitPrice: number }>,
  ) => {
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    return prisma.order.create({
      data: {
        companyId, storeId: shopId, orderNumber: Math.floor(Math.random() * 1e9),
        state: 'PAID', cashierUserId: cashierId,
        deliveryType: 'PICKUP', deliveryStatus: 'NONE',
        subtotal: subtotal.toFixed(2),
        discountTotal: '0.00', taxTotal: '0.00',
        grandTotal: subtotal.toFixed(2),
        paymentMethod: 'CARD',
        paidAmount: subtotal.toFixed(2),
        paidAt: new Date(),
        items: {
          create: items.map(i => ({
            productId: i.productId,
            productNameSnapshot: 'X',
            unitSnapshot: 'PIECE',
            originalUnitPrice: i.unitPrice.toFixed(2),
            taxRateSnapshot: '0.0000',
            quantity: i.qty.toFixed(3),
            lineTotal: (i.qty * i.unitPrice).toFixed(2),
          })),
        },
      },
    })
  }

  it('computes realizedMargin when all sold products have costPrice', async () => {
    const p = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'A', sku: 'A1', unit: 'PIECE',
        basePrice: '200.00', costPrice: '120.00',
      },
    })
    await createPaidOrder([{ productId: p.id, qty: 2, unitPrice: 200 }])

    const stats = await getShopsWithStats(companyId)
    const row = stats.find(s => s.id === shopId)!
    expect(row.revenueToday).toBe(400)
    expect(row.realizedMarginToday).toBe(160)
    expect(row.realizedMarginPctToday).toBeCloseTo(40, 5)
  })

  it('returns null margin when no sold product has costPrice', async () => {
    const p = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'B', sku: 'B1', unit: 'PIECE',
        basePrice: '100.00', costPrice: null,
      },
    })
    await createPaidOrder([{ productId: p.id, qty: 1, unitPrice: 100 }])

    const stats = await getShopsWithStats(companyId)
    const row = stats.find(s => s.id === shopId)!
    expect(row.revenueToday).toBe(100)
    expect(row.realizedMarginToday).toBeNull()
    expect(row.realizedMarginPctToday).toBeNull()
  })

  it('partial margin: ignores rows without costPrice', async () => {
    const p1 = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'C', sku: 'C1', unit: 'PIECE',
        basePrice: '100.00', costPrice: '60.00',
      },
    })
    const p2 = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'D', sku: 'D1', unit: 'PIECE',
        basePrice: '50.00', costPrice: null,
      },
    })
    await createPaidOrder([
      { productId: p1.id, qty: 1, unitPrice: 100 },
      { productId: p2.id, qty: 1, unitPrice: 50 },
    ])

    const stats = await getShopsWithStats(companyId)
    const row = stats.find(s => s.id === shopId)!
    expect(row.revenueToday).toBe(150)
    expect(row.realizedMarginToday).toBe(40)
    expect(row.realizedMarginPctToday).toBeCloseTo(26.6667, 3)
  })

  it('returns 0 stats for shop with no sales today', async () => {
    const stats = await getShopsWithStats(companyId)
    const row = stats.find(s => s.id === shopId)!
    expect(row.revenueToday).toBe(0)
    expect(row.realizedMarginToday).toBeNull()
    expect(row.realizedMarginPctToday).toBeNull()
  })
})
