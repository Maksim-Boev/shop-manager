import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestTaxRate, createTestProduct,
} from '../helpers'
import {
  getShopStock, getShopStaff, getAvailableStaffForShop,
  getShopSchedule, getStoreUsersForScheduling,
} from '../../lib/queries/shop-detail'

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

describe('getShopSchedule', () => {
  let companyId: string
  let shopId: string
  let userId: string
  let actorId: string

  const monday = (() => {
    const d = new Date()
    const dow = d.getDay()
    const off = dow === 0 ? -6 : 1 - dow
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + off)
  })()

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
    const shop = await createTestStore(companyId, { type: 'SHOP' })
    shopId = shop.id
    const u = await createTestUser(companyId, { role: 'CASHIER' })
    userId = u.id
    const admin = await createTestUser(companyId, { role: 'ADMIN' })
    actorId = admin.id
  })

  it('returns shifts within the week, sorted by startsAt', async () => {
    const day1Start = new Date(monday); day1Start.setHours(9, 0, 0, 0)
    const day1End   = new Date(monday); day1End.setHours(17, 0, 0, 0)
    const day3Start = new Date(monday); day3Start.setDate(monday.getDate() + 2); day3Start.setHours(10, 0, 0, 0)
    const day3End   = new Date(monday); day3End.setDate(monday.getDate() + 2); day3End.setHours(18, 0, 0, 0)

    await prisma.scheduledShift.createMany({
      data: [
        { companyId, storeId: shopId, userId, startsAt: day3Start, endsAt: day3End, createdByUserId: actorId },
        { companyId, storeId: shopId, userId, startsAt: day1Start, endsAt: day1End, createdByUserId: actorId },
      ],
    })

    const rows = await getShopSchedule(shopId, companyId, monday)
    expect(rows.length).toBe(2)
    expect(new Date(rows[0].startsAtIso).getTime()).toBeLessThan(new Date(rows[1].startsAtIso).getTime())
  })

  it('excludes shifts outside the week', async () => {
    const lastWeek = new Date(monday); lastWeek.setDate(monday.getDate() - 3); lastWeek.setHours(9, 0, 0, 0)
    const lastWeekEnd = new Date(lastWeek); lastWeekEnd.setHours(17, 0, 0, 0)

    await prisma.scheduledShift.create({
      data: { companyId, storeId: shopId, userId, startsAt: lastWeek, endsAt: lastWeekEnd, createdByUserId: actorId },
    })

    const rows = await getShopSchedule(shopId, companyId, monday)
    expect(rows.length).toBe(0)
  })

  it('isolates shifts by companyId (IDOR)', async () => {
    const start = new Date(monday); start.setHours(9, 0, 0, 0)
    const end   = new Date(monday); end.setHours(17, 0, 0, 0)
    await prisma.scheduledShift.create({
      data: { companyId, storeId: shopId, userId, startsAt: start, endsAt: end, createdByUserId: actorId },
    })

    const rows = await getShopSchedule(shopId, 'other-company', monday)
    expect(rows).toEqual([])
  })
})

describe('getStoreUsersForScheduling', () => {
  let companyId: string

  beforeEach(async () => {
    const company = await createTestCompany()
    companyId = company.id
  })

  it('returns all ACTIVE users of the company including CASHIER', async () => {
    const cashier = await createTestUser(companyId, { role: 'CASHIER' })
    const manager = await createTestUser(companyId, { role: 'MANAGER' })
    await createTestUser(companyId, { role: 'ADMIN' })

    const users = await getStoreUsersForScheduling(companyId)
    const ids = users.map(u => u.id)
    expect(ids).toContain(cashier.id)
    expect(ids).toContain(manager.id)
    expect(users.every(u => ['CASHIER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(u.role))).toBe(true)
  })

  it('isolates by company', async () => {
    const otherCompany = await createTestCompany({ name: 'Other' })
    await createTestUser(otherCompany.id, { role: 'CASHIER' })
    await createTestUser(companyId, { role: 'CASHIER' })

    const users = await getStoreUsersForScheduling(companyId)
    expect(users.length).toBe(1)
  })
})
