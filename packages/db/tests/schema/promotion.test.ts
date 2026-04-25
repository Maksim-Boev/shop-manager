import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCategory, createTestCompany, createTestStore } from '../helpers'

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d }
const nextWeek = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d }

const makePromo = (companyId: string, extra: object = {}) =>
  prisma.promotion.create({
    data: {
      companyId,
      name: 'Тест акция',
      validFrom: tomorrow(),
      validTo: nextWeek(),
      actionType: 'PERCENT',
      actionValue: '10.0000',
      ...extra,
    },
  })

describe('promotion schema', () => {
  it('создаёт акцию PERCENT', async () => {
    const company = await createTestCompany()
    const promo = await makePromo(company.id)
    expect(promo.actionType).toBe('PERCENT')
    expect(promo.status).toBe('DRAFT')
  })

  it('CHECK promotion_valid_range: validFrom >= validTo запрещён', async () => {
    const company = await createTestCompany()
    const now = new Date()
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Promotion" (id, "companyId", name, "validFrom", "validTo", "actionType", "actionValue", status, priority, "requiresCustomer", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'Bad', $2, $2, 'PERCENT', 10, 'DRAFT', 0, false, now(), now())`,
        company.id, now,
      ),
    ).rejects.toThrow()
  })

  it('CHECK promotion_bogo_coherence: BOGO требует все три BOGO-поля', async () => {
    const company = await createTestCompany()
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Promotion" (id, "companyId", name, "validFrom", "validTo", "actionType", "actionValue", "bogoTriggerQty", status, priority, "requiresCustomer", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'BOGO bad', now(), now() + interval '1 day', 'BOGO', 0, 2, 'DRAFT', 0, false, now(), now())`,
        company.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK promotion_bogo_coherence: PERCENT не должен иметь BOGO-поля', async () => {
    const company = await createTestCompany()
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Promotion" (id, "companyId", name, "validFrom", "validTo", "actionType", "actionValue", "bogoTriggerQty", "bogoGetQty", "bogoGetDiscountPercent", status, priority, "requiresCustomer", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'P bad', now(), now() + interval '1 day', 'PERCENT', 10, 1, 1, 50, 'DRAFT', 0, false, now(), now())`,
        company.id,
      ),
    ).rejects.toThrow()
  })

  it('PromotionTarget: ALL не требует targetId', async () => {
    const company = await createTestCompany()
    const promo = await makePromo(company.id)
    const target = await prisma.promotionTarget.create({
      data: { promotionId: promo.id, targetType: 'ALL' },
    })
    expect(target.targetId).toBeNull()
  })

  it('CHECK promotion_target_id_match: CATEGORY без targetId запрещён', async () => {
    const company = await createTestCompany()
    const promo = await makePromo(company.id)
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "PromotionTarget" (id, "promotionId", "targetType") VALUES (gen_random_uuid()::text, $1, 'CATEGORY')`,
        promo.id,
      ),
    ).rejects.toThrow()
  })

  it('PromotionStore — ограничение акции по магазинам', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const promo = await makePromo(company.id)
    await prisma.promotionStore.create({ data: { promotionId: promo.id, storeId: store.id } })

    const loaded = await prisma.promotion.findUniqueOrThrow({ where: { id: promo.id }, include: { stores: true } })
    expect(loaded.stores).toHaveLength(1)
  })
})
