import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma'

export const TEST_MARKER = '[test]'

export const uniqueEmail = () => `${randomUUID()}@test.example`

export const createTestCompany = async (overrides: Partial<{ name: string }> = {}) =>
  prisma.company.create({
    data: {
      name: `${overrides.name ?? 'Test Co'} ${TEST_MARKER}`,
      tierAssignmentMode: 'CUMULATIVE_LIFETIME',
      pointsEarnPercent: '0.01',
      pointsRedemptionRate: '0.01',
      pointsExpiryMode: 'NEVER',
      maxPromotionPercent: '50',
      maxTierPercent: '30',
      maxCustomerRulePercent: '30',
      maxTotalDiscountPercent: '70',
    },
  })

export const createTestStore = async (
  companyId: string,
  overrides: Partial<{ name: string; type: 'SHOP' | 'WAREHOUSE' }> = {},
) =>
  prisma.store.create({
    data: {
      companyId,
      name: overrides.name ?? 'Test Store',
      type: overrides.type ?? 'SHOP',
    },
  })

export const createTestUser = async (
  companyId: string,
  overrides: Partial<{
    email: string
    role: 'CASHIER' | 'ADMIN' | 'MANAGER' | 'SUPER_ADMIN'
    passwordHash: string
  }> = {},
) =>
  prisma.user.create({
    data: {
      companyId,
      email: overrides.email ?? uniqueEmail(),
      passwordHash: overrides.passwordHash ?? 'x',
      firstName: 'Test',
      lastName: 'User',
      role: overrides.role ?? 'CASHIER',
    },
  })

export const createTestCategory = async (companyId: string, name = 'Cat') =>
  prisma.category.create({ data: { companyId, name } })

export const createTestTaxRate = async (companyId: string) =>
  prisma.taxRate.create({ data: { companyId, name: 'НДС 20%', rate: '0.2000', isDefault: true } })

export const createTestProduct = async (
  companyId: string,
  categoryId: string,
  overrides: Partial<{ name: string; sku: string; basePrice: string; taxRateId: string }> = {},
) => {
  const taxRateId = overrides.taxRateId ?? (await createTestTaxRate(companyId)).id
  return prisma.product.create({
    data: {
      companyId,
      categoryId,
      taxRateId,
      name: overrides.name ?? 'Test Product',
      sku: overrides.sku ?? `SKU-${randomUUID().slice(0, 8)}`,
      basePrice: overrides.basePrice ?? '100.00',
      unit: 'PIECE',
    },
  })
}

export const cleanupTestCompanies = async () => {
  const companies = await prisma.company.findMany({ where: { name: { contains: TEST_MARKER } } })
  if (companies.length === 0) return
  const ids = companies.map(c => c.id)
  await prisma.store.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.company.deleteMany({ where: { id: { in: ids } } })
}

export const createTestCustomer = async (companyId: string) =>
  prisma.customer.create({
    data: {
      companyId,
      firstName: 'Test',
      lastName: 'Customer',
    },
  })

export const createTestTier = async (
  companyId: string,
  overrides: Partial<{ name: string; level: number; entryThreshold: string }> = {},
) =>
  prisma.tier.create({
    data: {
      companyId,
      name: overrides.name ?? 'Silver',
      level: overrides.level ?? 1,
      entryThreshold: overrides.entryThreshold ?? '0',
    },
  })

export const createTestPromotion = async (
  companyId: string,
  storeId: string,
  overrides: Partial<{
    name: string
    actionType: 'PERCENT' | 'FIXED_AMOUNT' | 'FIXED_PRICE' | 'BOGO'
    actionValue: string
    targetType: 'ALL' | 'PRODUCT' | 'CATEGORY' | 'SUBCATEGORY' | 'TAG'
    targetId: string | null
    validFrom: Date
    validTo: Date
    bogoTriggerQty: number
    bogoGetQty: number
    bogoGetDiscountPercent: string
    priority: number
  }> = {},
) => {
  const now = new Date()
  const far = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  const promo = await prisma.promotion.create({
    data: {
      companyId,
      name: overrides.name ?? 'Test Promo',
      status: 'ACTIVE',
      priority: overrides.priority ?? 0,
      actionType: overrides.actionType ?? 'PERCENT',
      actionValue: overrides.actionValue ?? '10',
      validFrom: overrides.validFrom ?? now,
      validTo: overrides.validTo ?? far,
      bogoTriggerQty: overrides.bogoTriggerQty,
      bogoGetQty: overrides.bogoGetQty,
      bogoGetDiscountPercent: overrides.bogoGetDiscountPercent,
    },
  })
  await prisma.promotionTarget.create({
    data: {
      promotionId: promo.id,
      targetType: overrides.targetType ?? 'ALL',
      targetId: overrides.targetId ?? null,
    },
  })
  await prisma.promotionStore.create({
    data: { promotionId: promo.id, storeId },
  })
  return promo
}
