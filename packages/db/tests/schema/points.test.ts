import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestCustomer } from '../helpers'

const makePoints = (companyId: string, customerId: string, type: string, amount: number, extra: object = {}) =>
  prisma.$executeRawUnsafe(
    `INSERT INTO "PointsTransaction" (id, "companyId", "customerId", type, amount, "balanceAfter", "occurredAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 0, now())`,
    companyId, customerId, type, amount,
  )

describe('PointsTransaction schema', () => {
  it('EARN создаётся через Prisma с положительным amount', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    const tx = await prisma.pointsTransaction.create({
      data: { companyId: company.id, customerId: customer.id, type: 'EARN', amount: 100, balanceAfter: 100 },
    })
    expect(tx.type).toBe('EARN')
    expect(tx.amount).toBe(100)
  })

  it('CHECK points_amount_sign: EARN с отрицательным amount запрещён', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await expect(makePoints(company.id, customer.id, 'EARN', -50)).rejects.toThrow()
  })

  it('CHECK points_amount_sign: SPEND с положительным amount запрещён', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await expect(makePoints(company.id, customer.id, 'SPEND', 50)).rejects.toThrow()
  })

  it('CHECK points_amount_sign: EXPIRE с положительным amount запрещён', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await expect(makePoints(company.id, customer.id, 'EXPIRE', 10)).rejects.toThrow()
  })

  it('CHECK points_expires_only_earn: expiresAt у SPEND запрещён', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "PointsTransaction" (id, "companyId", "customerId", type, amount, "balanceAfter", "occurredAt", "expiresAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'SPEND', -50, 0, now(), now() + interval '30 days')`,
        company.id, customer.id,
      ),
    ).rejects.toThrow()
  })

  it('EARN с expiresAt допустим', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    const expires = new Date(Date.now() + 30 * 86400000)
    const tx = await prisma.pointsTransaction.create({
      data: { companyId: company.id, customerId: customer.id, type: 'EARN', amount: 200, balanceAfter: 200, expiresAt: expires },
    })
    expect(tx.expiresAt).not.toBeNull()
  })

  it('MANUAL допускает любой знак amount', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)
    await makePoints(company.id, customer.id, 'MANUAL', 50)
    await makePoints(company.id, customer.id, 'MANUAL', -30)
    const rows = await prisma.pointsTransaction.findMany({ where: { customerId: customer.id, type: 'MANUAL' } })
    expect(rows).toHaveLength(2)
  })
})
