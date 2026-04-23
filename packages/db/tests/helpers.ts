import { prisma } from '../lib/prisma'

export const createTestCompany = async (overrides: Partial<{ name: string }> = {}) => {
  return prisma.company.create({
    data: {
      name: overrides.name ?? 'Test Co',
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
}
