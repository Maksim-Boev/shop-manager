import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createTestCompany } from '../helpers'

describe('foundation schema', () => {
  it('создаёт компанию и магазин', async () => {
    const company = await createTestCompany()
    const store = await prisma.store.create({
      data: { companyId: company.id, type: 'SHOP', name: 'Main' },
    })
    expect(store.type).toBe('SHOP')
    expect(store.enableFiscalReports).toBe(false)
    expect(store.status).toBe('ACTIVE')
  })

  it('User.email уникален глобально', async () => {
    const company = await createTestCompany()
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: 'a@b.c',
        passwordHash: 'x',
        firstName: 'A',
        lastName: 'B',
        role: 'CASHIER',
      },
    })
    await expect(
      prisma.user.create({
        data: {
          companyId: company.id,
          email: 'a@b.c',
          passwordHash: 'x',
          firstName: 'C',
          lastName: 'D',
          role: 'CASHIER',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('ManagerStore — M:N между User и Store', async () => {
    const company = await createTestCompany()
    const [store1, store2] = await Promise.all([
      prisma.store.create({ data: { companyId: company.id, type: 'SHOP', name: 'S1' } }),
      prisma.store.create({ data: { companyId: company.id, type: 'SHOP', name: 'S2' } }),
    ])
    const manager = await prisma.user.create({
      data: {
        companyId: company.id,
        email: 'm@shop.co',
        passwordHash: 'x',
        firstName: 'M',
        lastName: 'N',
        role: 'MANAGER',
      },
    })
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
})
