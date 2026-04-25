import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestStore, createTestUser } from '../helpers'

const openShift = (companyId: string, storeId: string, cashierUserId: string) =>
  prisma.shift.create({
    data: { companyId, storeId, cashierUserId, openingCash: '0' },
  })

describe('Shift schema', () => {
  it('создаёт открытую смену', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const shift = await openShift(company.id, store.id, cashier.id)
    expect(shift.status).toBe('OPEN')
    expect(shift.closedAt).toBeNull()
  })

  it('partial unique: нельзя открыть вторую смену для того же кассира в компании', async () => {
    const company = await createTestCompany()
    const store1 = await createTestStore(company.id, { name: 'S1' })
    const store2 = await createTestStore(company.id, { name: 'S2' })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await openShift(company.id, store1.id, cashier.id)
    await expect(openShift(company.id, store2.id, cashier.id)).rejects.toThrow()
  })

  it('можно открыть вторую смену после закрытия первой', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const shift1 = await openShift(company.id, store.id, cashier.id)
    await prisma.shift.update({
      where: { id: shift1.id },
      data: { status: 'CLOSED', closedAt: new Date(), closingCash: '500.00', expectedCash: '500.00', variance: '0' },
    })

    const shift2 = await openShift(company.id, store.id, cashier.id)
    expect(shift2.status).toBe('OPEN')
  })

  it('CHECK shift_closed_fields: CLOSED требует closedAt', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)
    const shift = await openShift(company.id, store.id, cashier.id)

    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE "Shift" SET status = 'CLOSED' WHERE id = $1`,
        shift.id,
      ),
    ).rejects.toThrow()
  })

  it('CHECK shift_closed_fields: OPEN не должен иметь closedAt', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Shift" (id, "companyId", "storeId", "cashierUserId", status, "openedAt", "openingCash", "closedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'OPEN', now(), 0, now())`,
        company.id, store.id, cashier.id,
      ),
    ).rejects.toThrow()
  })

  it('ShiftReport сохраняется к смене', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id)
    const shift = await openShift(company.id, store.id, cashier.id)

    const report = await prisma.shiftReport.create({
      data: { shiftId: shift.id, type: 'X', snapshot: { totalSales: 1500, cashSales: 1500 } },
    })
    expect(report.type).toBe('X')
  })
})
