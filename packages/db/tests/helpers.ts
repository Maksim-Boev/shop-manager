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
  overrides: Partial<{ email: string; role: 'CASHIER' | 'ADMIN' | 'MANAGER' | 'SUPER_ADMIN' }> = {},
) =>
  prisma.user.create({
    data: {
      companyId,
      email: overrides.email ?? uniqueEmail(),
      passwordHash: 'x',
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

export const createTestCustomer = async (companyId: string) =>
  prisma.customer.create({
    data: {
      companyId,
      firstName: 'Test',
      lastName: 'Customer',
    },
  })
