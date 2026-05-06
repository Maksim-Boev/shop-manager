import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestTaxRate, createTestProduct,
} from '../helpers'
import { getShopStock, getShopStaff, getAvailableStaffForShop } from '../../lib/queries/shop-detail'

describe('getShopStock', () => {
  let companyId: string
  let shopId: string

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
    const shop = await createTestStore(companyId, { type: 'SHOP' })
    shopId = shop.id

    const cat = await createTestCategory(companyId)
    const tax = await createTestTaxRate(companyId)
    const product = await createTestProduct(companyId, cat.id, {
      taxRateId: tax.id,
      basePrice: '100.00',
    })
    await prisma.storeProduct.create({
      data: { storeId: shopId, productId: product.id, stock: '5' },
    })
  })

  it('returns items for correct company', async () => {
    const items = await getShopStock(shopId, companyId)
    expect(items.length).toBe(1)
    expect(items[0].stock).toBe(5)
    expect(items[0].effectivePrice).toBe(100)
  })

  it('returns empty for wrong companyId (IDOR)', async () => {
    const items = await getShopStock(shopId, 'wrong-company-id')
    expect(items).toEqual([])
  })

  it('sorts: stock=0 first, then stock<10, then rest', async () => {
    const cat = await createTestCategory(companyId)
    const tax = await createTestTaxRate(companyId)

    const p2 = await createTestProduct(companyId, cat.id, { taxRateId: tax.id, sku: 'SKU-2' })
    const p3 = await createTestProduct(companyId, cat.id, { taxRateId: tax.id, sku: 'SKU-3' })

    await prisma.storeProduct.createMany({
      data: [
        { storeId: shopId, productId: p2.id, stock: '0' },
        { storeId: shopId, productId: p3.id, stock: '50' },
      ],
    })

    const items = await getShopStock(shopId, companyId)
    expect(items[0].stock).toBe(0)
    expect(items[1].stock).toBe(5)
    expect(items[2].stock).toBe(50)
  })
})

describe('getShopStaff', () => {
  let companyId: string
  let shopId: string
  let userId: string

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
    const shop = await createTestStore(companyId, { type: 'SHOP' })
    shopId = shop.id
    const user = await createTestUser(companyId, { role: 'MANAGER' })
    userId = user.id
    await prisma.managerStore.create({ data: { storeId: shopId, userId } })
  })

  it('returns assigned managers', async () => {
    const staff = await getShopStaff(shopId, companyId)
    expect(staff.length).toBe(1)
    expect(staff[0].userId).toBe(userId)
    expect(staff[0].hasOpenShift).toBe(false)
  })

  it('returns empty for wrong companyId (IDOR)', async () => {
    const staff = await getShopStaff(shopId, 'wrong-id')
    expect(staff).toEqual([])
  })
})

describe('getAvailableStaffForShop', () => {
  let companyId: string
  let shopId: string

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
    const shop = await createTestStore(companyId, { type: 'SHOP' })
    shopId = shop.id
  })

  it('excludes already-assigned users', async () => {
    const assigned = await createTestUser(companyId, { role: 'MANAGER' })
    const available = await createTestUser(companyId, { role: 'MANAGER' })
    await prisma.managerStore.create({ data: { storeId: shopId, userId: assigned.id } })

    const users = await getAvailableStaffForShop(shopId, companyId)
    const ids = users.map(u => u.id)
    expect(ids).not.toContain(assigned.id)
    expect(ids).toContain(available.id)
  })

  it('excludes CASHIER and SUPER_ADMIN roles', async () => {
    await createTestUser(companyId, { role: 'CASHIER' })
    await createTestUser(companyId, { role: 'SUPER_ADMIN' })
    const admin = await createTestUser(companyId, { role: 'ADMIN' })

    const users = await getAvailableStaffForShop(shopId, companyId)
    expect(users.every(u => u.role === 'MANAGER' || u.role === 'ADMIN')).toBe(true)
    expect(users.some(u => u.id === admin.id)).toBe(true)
  })
})
