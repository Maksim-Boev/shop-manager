import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestUser } from '../helpers'

const makeRate = async (
  companyId: string,
  userId: string,
  overrides: Partial<{
    ratePeriod: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'
    rateAmount: string
    salesPercent: string
    effectiveFrom: Date
    effectiveTo: Date | null
  }> = {},
) =>
  prisma.userSalaryRate.create({
    data: {
      companyId,
      userId,
      ratePeriod: overrides.ratePeriod ?? 'MONTH',
      rateAmount: overrides.rateAmount ?? '50000.00',
      salesPercent: overrides.salesPercent ?? '2.0000',
      effectiveFrom: overrides.effectiveFrom ?? new Date('2026-01-01'),
      effectiveTo: overrides.effectiveTo ?? null,
      createdByUserId: userId,
    },
  })

const makePayout = async (
  companyId: string,
  userId: string,
  overrides: Partial<{
    periodYear: number
    periodMonth: number
    totalAmount: string
    status: 'PENDING' | 'PAID' | 'CANCELLED'
    paidAt: Date | null
    paymentMethod: 'CASH' | 'CARD' | 'MANUAL' | null
  }> = {},
) =>
  prisma.salaryPayout.create({
    data: {
      companyId,
      userId,
      periodYear: overrides.periodYear ?? 2026,
      periodMonth: overrides.periodMonth ?? 1,
      totalAmount: overrides.totalAmount ?? '60000.00',
      status: overrides.status ?? 'PENDING',
      paidAt: overrides.paidAt ?? null,
      paymentMethod: overrides.paymentMethod ?? null,
      createdByUserId: userId,
    },
  })

describe('UserSalaryRate schema', () => {
  it('создаёт активную ставку', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const rate = await makeRate(company.id, cashier.id)
    expect(rate.ratePeriod).toBe('MONTH')
    expect(rate.effectiveTo).toBeNull()
  })

  it('partial unique: нельзя создать вторую активную ставку для того же сотрудника', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await makeRate(company.id, cashier.id)
    await expect(makeRate(company.id, cashier.id)).rejects.toThrow()
  })

  it('можно создать новую ставку, если предыдущая закрыта', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const rate1 = await makeRate(company.id, cashier.id, { effectiveFrom: new Date('2026-01-01') })
    await prisma.userSalaryRate.update({
      where: { id: rate1.id },
      data: { effectiveTo: new Date('2026-03-01') },
    })

    const rate2 = await makeRate(company.id, cashier.id, { effectiveFrom: new Date('2026-03-01') })
    expect(rate2.effectiveTo).toBeNull()
  })

  it('CHECK user_salary_rate_nonneg: отрицательная ставка запрещена', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makeRate(company.id, cashier.id, { rateAmount: '-1.00' })).rejects.toThrow()
  })

  it('CHECK user_salary_rate_nonneg: отрицательный процент запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makeRate(company.id, cashier.id, { salesPercent: '-0.5000' })).rejects.toThrow()
  })

  it('CHECK user_salary_rate_valid_range: effectiveTo <= effectiveFrom запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(
      makeRate(company.id, cashier.id, {
        effectiveFrom: new Date('2026-03-01'),
        effectiveTo: new Date('2026-02-01'),
      }),
    ).rejects.toThrow()
  })

  it('каскад: удаление User удаляет UserSalaryRate', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await makeRate(company.id, cashier.id)

    await prisma.user.delete({ where: { id: cashier.id } })
    const rates = await prisma.userSalaryRate.findMany({ where: { userId: cashier.id } })
    expect(rates).toHaveLength(0)
  })
})

describe('SalaryPayout schema', () => {
  it('создаёт начисление в статусе PENDING', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const payout = await makePayout(company.id, cashier.id)
    expect(payout.status).toBe('PENDING')
    expect(payout.paidAt).toBeNull()
  })

  it('@@unique([userId, periodYear, periodMonth]): повтор за месяц запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await makePayout(company.id, cashier.id, { periodYear: 2026, periodMonth: 3 })
    await expect(
      makePayout(company.id, cashier.id, { periodYear: 2026, periodMonth: 3 }),
    ).rejects.toThrow()
  })

  it('разные месяцы для одного сотрудника разрешены', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await makePayout(company.id, cashier.id, { periodMonth: 1 })
    await makePayout(company.id, cashier.id, { periodMonth: 2 })
    const rows = await prisma.salaryPayout.findMany({ where: { userId: cashier.id } })
    expect(rows).toHaveLength(2)
  })

  it('CHECK salary_payout_period_range: month=13 запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makePayout(company.id, cashier.id, { periodMonth: 13 })).rejects.toThrow()
  })

  it('CHECK salary_payout_period_range: month=0 запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makePayout(company.id, cashier.id, { periodMonth: 0 })).rejects.toThrow()
  })

  it('CHECK salary_payout_period_range: year=1999 запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makePayout(company.id, cashier.id, { periodYear: 1999 })).rejects.toThrow()
  })

  it('CHECK salary_payout_amount_nonneg: отрицательная сумма запрещена', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(makePayout(company.id, cashier.id, { totalAmount: '-1.00' })).rejects.toThrow()
  })

  it('CHECK salary_payout_paid_coherence: PAID требует paidAt и paymentMethod', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const payout = await makePayout(company.id, cashier.id, {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: 'CASH',
    })
    expect(payout.status).toBe('PAID')
  })

  it('CHECK salary_payout_paid_coherence: PAID без paidAt запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(
      makePayout(company.id, cashier.id, { status: 'PAID', paymentMethod: 'CASH' }),
    ).rejects.toThrow()
  })

  it('CHECK salary_payout_paid_coherence: PAID без paymentMethod запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(
      makePayout(company.id, cashier.id, { status: 'PAID', paidAt: new Date() }),
    ).rejects.toThrow()
  })

  it('CHECK salary_payout_paid_coherence: PENDING с заполненными paidAt+paymentMethod запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(
      makePayout(company.id, cashier.id, {
        status: 'PENDING',
        paidAt: new Date(),
        paymentMethod: 'CASH',
      }),
    ).rejects.toThrow()
  })

  it('CHECK salary_payout_cancelled_unpaid: CANCELLED с paidAt запрещён', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    await expect(
      makePayout(company.id, cashier.id, { status: 'CANCELLED', paidAt: new Date() }),
    ).rejects.toThrow()
  })

  it('начисляется и менеджеру, и кассиру (валидация роли — на уровне приложения)', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const manager = await createTestUser(company.id, { role: 'MANAGER' })

    await makePayout(company.id, cashier.id, { periodMonth: 4 })
    await makePayout(company.id, manager.id, { periodMonth: 4 })

    const rows = await prisma.salaryPayout.findMany({ where: { companyId: company.id } })
    expect(rows).toHaveLength(2)
  })
})
