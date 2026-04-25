import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestCustomer } from '../helpers'

describe('customer schema', () => {
  it('создаёт Customer с дефолтами', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    expect(customer.status).toBe('ACTIVE')
    expect(customer.pointsBalance).toBe(0)
    expect(customer.totalSpent.toString()).toBe('0')
  })

  it('CustomerContact: unique (companyId, type, value)', async () => {
    const company = await createTestCompany()
    const c1 = await createTestCustomer(company.id)
    const c2 = await createTestCustomer(company.id)

    await prisma.customerContact.create({
      data: { customerId: c1.id, companyId: company.id, type: 'PHONE', value: '+79001234567' },
    })
    await expect(
      prisma.customerContact.create({
        data: { customerId: c2.id, companyId: company.id, type: 'PHONE', value: '+79001234567' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('Tier: unique (companyId, level)', async () => {
    const company = await createTestCompany()
    await prisma.tier.create({ data: { companyId: company.id, name: 'Silver', level: 1, entryThreshold: '1000' } })
    await expect(
      prisma.tier.create({ data: { companyId: company.id, name: 'SilverDup', level: 1, entryThreshold: '2000' } }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('TierRule с discountPercent', async () => {
    const company = await createTestCompany()
    const tier = await prisma.tier.create({ data: { companyId: company.id, name: 'Gold', level: 2, entryThreshold: '5000' } })
    const rule = await prisma.tierRule.create({
      data: { tierId: tier.id, scope: 'WHOLE_ORDER', discountPercent: '0.0500' },
    })
    expect(rule.discountPercent?.toString()).toBe('0.05')
  })

  it('CHECK tier_rule_one_discount: нельзя задать и percent и amount одновременно', async () => {
    const company = await createTestCompany()
    const tier = await prisma.tier.create({ data: { companyId: company.id, name: 'Platinum', level: 3, entryThreshold: '10000' } })
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "TierRule" (id, "tierId", scope, "discountPercent", "discountAmount") VALUES (gen_random_uuid()::text, $1, 'WHOLE_ORDER', 0.05, 50)`,
        tier.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK tier_rule_target_match: CATEGORY требует targetId', async () => {
    const company = await createTestCompany()
    const tier = await prisma.tier.create({ data: { companyId: company.id, name: 'T', level: 4, entryThreshold: '100' } })
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "TierRule" (id, "tierId", scope, "discountPercent") VALUES (gen_random_uuid()::text, $1, 'CATEGORY', 0.05)`,
        tier.id,
      ),
    ).rejects.toThrow()
  })

  it('CustomerDiscountRule — персональная скидка с validFrom/validTo', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    const rule = await prisma.customerDiscountRule.create({
      data: {
        customerId: customer.id,
        scope: 'WHOLE_ORDER',
        discountPercent: '0.1000',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 86400000),
      },
    })
    expect(rule.discountPercent?.toString()).toBe('0.1')
  })

  it('CHECK customer_rule_one_discount: нельзя оба поля скидки', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "CustomerDiscountRule" (id, "customerId", scope, "discountPercent", "discountAmount") VALUES (gen_random_uuid()::text, $1, 'WHOLE_ORDER', 0.1, 50)`,
        customer.id,
      ),
    ).rejects.toThrow()
  })
})
