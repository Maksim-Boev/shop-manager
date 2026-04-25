import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany, createTestStore, createTestUser, uniqueEmail } from '../helpers'

describe('foundation schema', () => {
  it('создаёт компанию и магазин', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)
    expect(store.type).toBe('SHOP')
    expect(store.enableFiscalReports).toBe(false)
    expect(store.status).toBe('ACTIVE')
  })

  it('User.email уникален глобально', async () => {
    const company = await createTestCompany()
    const email = uniqueEmail()
    await prisma.user.create({
      data: { companyId: company.id, email, passwordHash: 'x', firstName: 'A', lastName: 'B', role: 'CASHIER' },
    })
    await expect(
      prisma.user.create({
        data: { companyId: company.id, email, passwordHash: 'x', firstName: 'C', lastName: 'D', role: 'CASHIER' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('ManagerStore — M:N между User и Store', async () => {
    const company = await createTestCompany()
    const [store1, store2] = await Promise.all([
      createTestStore(company.id, { name: 'S1' }),
      createTestStore(company.id, { name: 'S2' }),
    ])
    const manager = await createTestUser(company.id, { role: 'MANAGER' })
    await prisma.managerStore.createMany({
      data: [
        { userId: manager.id, storeId: store1.id },
        { userId: manager.id, storeId: store2.id },
      ],
    })
    const reloaded = await prisma.user.findUniqueOrThrow({
      where: { id: manager.id },
      include: { managedStores: true },
    })
    expect(reloaded.managedStores).toHaveLength(2)
  })

  it('WAREHOUSE не даёт enableFiscalReports', async () => {
    const company = await createTestCompany()
    const wh = await createTestStore(company.id, { type: 'WAREHOUSE', name: 'WH' })
    expect(wh.type).toBe('WAREHOUSE')
    expect(wh.enableFiscalReports).toBe(false)
  })
})
