import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestTaxRate, createTestProduct,
} from '../helpers'
import {
  getShopStock, getShopStaff, getAvailableStaffForShop,
  getShopSchedule, getStoreUsersForScheduling, getShopMargin,
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

  it('returns costPrice and marginPct when costPrice is set', async () => {
    const cat = await createTestCategory(companyId)
    const tax = await createTestTaxRate(companyId)
    const p = await prisma.product.create({
      data: {
        companyId, categoryId: cat.id, taxRateId: tax.id,
        name: 'P-cost', sku: 'SKU-COST', unit: 'PIECE',
        basePrice: '200.00', costPrice: '150.00',
      },
    })
    await prisma.storeProduct.create({
      data: { storeId: shopId, productId: p.id, stock: '5' },
    })

    const items = await getShopStock(shopId, companyId)
    const row = items.find(i => i.sku === 'SKU-COST')!
    expect(row.costPrice).toBe(150)
    expect(row.marginPct).toBeCloseTo(25, 5)
  })

  it('returns null cost/marginPct when costPrice is not set', async () => {
    const items = await getShopStock(shopId, companyId)
    expect(items[0].costPrice).toBeNull()
    expect(items[0].marginPct).toBeNull()
  })

  it('returns negative marginPct when costPrice > basePrice', async () => {
    const cat = await createTestCategory(companyId)
    const tax = await createTestTaxRate(companyId)
    const p = await prisma.product.create({
      data: {
        companyId, categoryId: cat.id, taxRateId: tax.id,
        name: 'Loss', sku: 'SKU-LOSS', unit: 'PIECE',
        basePrice: '100.00', costPrice: '120.00',
      },
    })
    await prisma.storeProduct.create({
      data: { storeId: shopId, productId: p.id, stock: '1' },
    })

    const items = await getShopStock(shopId, companyId)
    const row = items.find(i => i.sku === 'SKU-LOSS')!
    expect(row.marginPct).toBeCloseTo(-20, 5)
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

  it('excludes only SUPER_ADMIN; includes MANAGER, ADMIN, CASHIER, SALESPERSON', async () => {
    const cashier = await createTestUser(companyId, { role: 'CASHIER' })
    const salesperson = await createTestUser(companyId, { role: 'SALESPERSON' })
    const superAdmin = await createTestUser(companyId, { role: 'SUPER_ADMIN' })
    const admin = await createTestUser(companyId, { role: 'ADMIN' })
    const manager = await createTestUser(companyId, { role: 'MANAGER' })

    const users = await getAvailableStaffForShop(shopId, companyId)
    const ids = users.map(u => u.id)
    expect(ids).toContain(cashier.id)
    expect(ids).toContain(salesperson.id)
    expect(ids).toContain(admin.id)
    expect(ids).toContain(manager.id)
    expect(ids).not.toContain(superAdmin.id)
    expect(users.every(u => u.role !== 'SUPER_ADMIN')).toBe(true)
  })

  it('повертає користувачів усіх ролей крім SUPER_ADMIN, що активні і не привʼязані', async () => {
    const cashier = await createTestUser(companyId, { role: 'CASHIER' })
    const manager = await createTestUser(companyId, { role: 'MANAGER' })
    const salesperson = await createTestUser(companyId, { role: 'SALESPERSON' })
    const attached = await createTestUser(companyId, { role: 'CASHIER' })
    await prisma.managerStore.create({ data: { userId: attached.id, storeId: shopId } })

    const result = await getAvailableStaffForShop(shopId, companyId)
    const ids = result.map(r => r.id).sort()
    expect(ids).toEqual([cashier.id, manager.id, salesperson.id].sort())
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

  it('повертає поле isShiftLeader', async () => {
    const start = new Date(monday); start.setHours(9, 0, 0, 0)
    const end   = new Date(monday); end.setHours(17, 0, 0, 0)
    await prisma.scheduledShift.create({
      data: {
        companyId, storeId: shopId, userId,
        startsAt: start, endsAt: end,
        isShiftLeader: true,
        createdByUserId: actorId,
      },
    })

    const rows = await getShopSchedule(shopId, companyId, monday)
    expect(rows).toHaveLength(1)
    expect(rows[0].isShiftLeader).toBe(true)
  })

  it('isShiftLeader по дефолту false для змін без явної ознаки', async () => {
    const start = new Date(monday); start.setHours(9, 0, 0, 0)
    const end   = new Date(monday); end.setHours(17, 0, 0, 0)
    await prisma.scheduledShift.create({
      data: { companyId, storeId: shopId, userId, startsAt: start, endsAt: end, createdByUserId: actorId },
    })

    const rows = await getShopSchedule(shopId, companyId, monday)
    expect(rows).toHaveLength(1)
    expect(rows[0].isShiftLeader).toBe(false)
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

describe('getShopMargin', () => {
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

  it('returns realized + stock margin for week range', async () => {
    const p = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'M', sku: 'M1', unit: 'PIECE',
        basePrice: '200.00', costPrice: '150.00',
      },
    })
    await prisma.storeProduct.create({
      data: { storeId: shopId, productId: p.id, stock: '10' },
    })
    await createPaidOrder([{ productId: p.id, qty: 2, unitPrice: 200 }])

    const data = await getShopMargin(shopId, companyId, 'week')
    expect(data.realized.revenue).toBe(400)
    expect(data.realized.cost).toBe(300)
    expect(data.realized.margin).toBe(100)
    expect(data.realized.marginPct).toBeCloseTo(25, 5)
    expect(data.realized.skuWithCostCount).toBe(1)
    expect(data.realized.skuWithoutCostCount).toBe(0)

    expect(data.stock.valueAtPrice).toBe(2000)
    expect(data.stock.valueAtCost).toBe(1500)
    expect(data.stock.margin).toBe(500)
    expect(data.stock.marginPct).toBeCloseTo(25, 5)
    expect(data.stock.skuWithCostCount).toBe(1)
    expect(data.stock.skuWithoutCostCount).toBe(0)
  })

  it('returns null margin and counts skuWithoutCost when no costPrice set', async () => {
    const p = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'NoCost', sku: 'NC1', unit: 'PIECE',
        basePrice: '100.00', costPrice: null,
      },
    })
    await prisma.storeProduct.create({
      data: { storeId: shopId, productId: p.id, stock: '3' },
    })

    const data = await getShopMargin(shopId, companyId, 'week')
    expect(data.realized.revenue).toBe(0)
    expect(data.realized.marginPct).toBeNull()
    expect(data.stock.valueAtPrice).toBe(300)
    expect(data.stock.valueAtCost).toBe(0)
    expect(data.stock.marginPct).toBeNull()
    expect(data.stock.skuWithoutCostCount).toBe(1)
  })

  it('partial realized margin: ignores items without costPrice but counts revenue', async () => {
    const p1 = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'P1', sku: 'PM-1', unit: 'PIECE',
        basePrice: '100.00', costPrice: '60.00',
      },
    })
    const p2 = await prisma.product.create({
      data: {
        companyId, categoryId, taxRateId,
        name: 'P2', sku: 'PM-2', unit: 'PIECE',
        basePrice: '50.00', costPrice: null,
      },
    })
    await createPaidOrder([
      { productId: p1.id, qty: 1, unitPrice: 100 },
      { productId: p2.id, qty: 1, unitPrice: 50 },
    ])

    const data = await getShopMargin(shopId, companyId, 'week')
    expect(data.realized.revenue).toBe(150)        // full revenue
    expect(data.realized.cost).toBe(60)            // covered cost only
    expect(data.realized.margin).toBe(40)          // coveredRevenue (100) - cost (60)
    expect(data.realized.marginPct).toBeCloseTo(26.6667, 3) // 40 / 150
    expect(data.realized.skuWithCostCount).toBe(1)
    expect(data.realized.skuWithoutCostCount).toBe(1)
  })

  it('IDOR-protected: returns zero data for wrong companyId', async () => {
    const data = await getShopMargin(shopId, 'wrong-company', 'week')
    expect(data.realized.revenue).toBe(0)
    expect(data.stock.valueAtPrice).toBe(0)
  })
})
