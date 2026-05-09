import { describe, expect, it, afterEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestStore, createTestUser, cleanupTestCompanies } from '../helpers'
import { openShift, closeShift, generateShiftReport } from '../../lib/services/shift'
import { ShiftAlreadyOpenError, ShiftNotOpenError, ShopError } from '../../lib/services/errors'

describe('openShift', () => {
  it('создаёт OPEN-смену', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    const shift = await openShift(prisma, {
      companyId: company.id,
      storeId: store.id,
      cashierUserId: cashier.id,
      openingCash: '1000.00',
    })

    expect(shift.status).toBe('OPEN')
    expect(shift.storeId).toBe(store.id)
    expect(Number(shift.openingCash)).toBe(1000)
    expect(shift.closedAt).toBeNull()
  })

  it('ShiftAlreadyOpenError при повторном открытии', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })

    await expect(
      openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    ).rejects.toThrow(ShiftAlreadyOpenError)
  })

  it('ShopError для магазина типа WAREHOUSE', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id, { type: 'WAREHOUSE' })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await expect(
      openShift(prisma, { companyId: company.id, storeId: store.id, cashierUserId: cashier.id, openingCash: '0' })
    ).rejects.toThrow(ShopError)
  })
})

describe('closeShift', () => {
  it('корректно считает expectedCash и variance', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '500.00',
    })

    // Создаём оплаченный CASH-заказ вручную
    await prisma.order.create({
      data: {
        companyId: company.id, storeId: store.id, orderNumber: 1,
        cashierUserId: cashier.id, shiftId: shift.id,
        state: 'PAID', paymentMethod: 'CASH',
        paidAmount: '300.00', paidAt: new Date(),
      },
    })

    const closed = await closeShift(prisma, {
      shiftId: shift.id, cashierUserId: cashier.id, closingCash: '800.00',
    })

    expect(closed.status).toBe('CLOSED')
    expect(Number(closed.expectedCash)).toBe(800)
    expect(Number(closed.variance)).toBe(0)
    expect(closed.closedAt).not.toBeNull()
  })

  it('создаёт Z-отчёт если enableFiscalReports = true', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    await prisma.store.update({ where: { id: store.id }, data: { enableFiscalReports: true } })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })

    await closeShift(prisma, { shiftId: shift.id, cashierUserId: cashier.id, closingCash: '0' })

    const report = await prisma.shiftReport.findFirst({ where: { shiftId: shift.id, type: 'Z' } })
    expect(report).not.toBeNull()
    expect(report?.snapshot).toMatchObject({ orderCount: 0 })
  })

  it('ShiftNotOpenError если смена уже закрыта', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    await closeShift(prisma, { shiftId: shift.id, cashierUserId: cashier.id, closingCash: '0' })

    await expect(
      closeShift(prisma, { shiftId: shift.id, cashierUserId: cashier.id, closingCash: '0' })
    ).rejects.toThrow(ShiftNotOpenError)
  })

  it('ShopError если кассир не совпадает', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const cashier1 = await createTestUser(company.id, { role: 'CASHIER' })
    const cashier2 = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier1.id, openingCash: '0',
    })

    await expect(
      closeShift(prisma, { shiftId: shift.id, cashierUserId: cashier2.id, closingCash: '0' })
    ).rejects.toThrow(ShopError)
  })
})

describe('generateShiftReport', () => {
  it('создаёт X-отчёт для открытой смены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    await prisma.store.update({ where: { id: store.id }, data: { enableFiscalReports: true } })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })

    const report = await generateShiftReport(prisma, { shiftId: shift.id, type: 'X' })

    expect(report.type).toBe('X')
    expect(report.shiftId).toBe(shift.id)
    expect(report.snapshot).toMatchObject({ orderCount: 0, totalSales: '0.00' })
  })

  it('ShopError если fiscal reports отключены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id) // enableFiscalReports: false по умолчанию
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })

    await expect(
      generateShiftReport(prisma, { shiftId: shift.id, type: 'X' })
    ).rejects.toThrow(ShopError)
  })

  it('ShiftNotOpenError для закрытой смены', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    await prisma.store.update({ where: { id: store.id }, data: { enableFiscalReports: true } })
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const shift = await openShift(prisma, {
      companyId: company.id, storeId: store.id,
      cashierUserId: cashier.id, openingCash: '0',
    })
    await closeShift(prisma, { shiftId: shift.id, cashierUserId: cashier.id, closingCash: '0' })

    await expect(
      generateShiftReport(prisma, { shiftId: shift.id, type: 'X' })
    ).rejects.toThrow(ShiftNotOpenError)
  })
})

describe('openShift — гейт SALESPERSON', () => {
  afterEach(async () => {
    await cleanupTestCompanies()
  })

  it('забороняє відкрити зміну для SALESPERSON', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    const sp = await createTestUser(company.id, { role: 'SALESPERSON' })

    await expect(
      openShift(prisma, {
        companyId: company.id,
        storeId: store.id,
        cashierUserId: sp.id,
        openingCash: '0',
      }),
    ).rejects.toThrow('Продавець не має доступу до каси')

    const created = await prisma.shift.findFirst({ where: { storeId: store.id } })
    expect(created).toBeNull()
  })
})
