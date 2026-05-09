import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { setUserStatusImpl, createStaffMemberImpl } from '../../lib/services/staff'
import {
  createTestCompany,
  createTestUser,
  createTestStore,
  cleanupTestCompanies,
  uniqueEmail,
} from '../helpers'
import type { AuthUser } from '../../lib/auth'

const asAuthUser = (
  id: string,
  companyId: string | null,
  role: AuthUser['role'],
): AuthUser => ({
  id,
  companyId,
  role,
  firstName: 'Actor',
  lastName: 'Actor',
})

describe('setUserStatusImpl', () => {
  afterEach(async () => {
    await cleanupTestCompanies()
  })

  it('ADMIN блокує MANAGER', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const manager = await createTestUser(company.id, { role: 'MANAGER' })

    await setUserStatusImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      { userId: manager.id, status: 'BLOCKED' },
    )

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: manager.id } })
    expect(reloaded.status).toBe('BLOCKED')
  })

  it('забороняє блокувати самого себе', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    await expect(
      setUserStatusImpl(
        asAuthUser(admin.id, company.id, 'ADMIN'),
        { userId: admin.id, status: 'BLOCKED' },
      ),
    ).rejects.toThrow('Не можна змінити власний статус')
  })

  it('ADMIN не може заблокувати іншого ADMIN', async () => {
    const company = await createTestCompany()
    const a1 = await createTestUser(company.id, { role: 'ADMIN' })
    const a2 = await createTestUser(company.id, { role: 'ADMIN' })

    await expect(
      setUserStatusImpl(
        asAuthUser(a1.id, company.id, 'ADMIN'),
        { userId: a2.id, status: 'BLOCKED' },
      ),
    ).rejects.toThrow('Адмін не може змінити статус іншого адміна')
  })

  it('SUPER_ADMIN може заблокувати ADMIN', async () => {
    const company = await createTestCompany()
    const sa = await createTestUser(company.id, { role: 'SUPER_ADMIN' })
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    await setUserStatusImpl(
      asAuthUser(sa.id, company.id, 'SUPER_ADMIN'),
      { userId: admin.id, status: 'BLOCKED' },
    )

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })
    expect(reloaded.status).toBe('BLOCKED')
  })

  it('помилка при спробі блокувати користувача іншої компанії', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const stranger = await createTestUser(c2.id, { role: 'MANAGER' })

    await expect(
      setUserStatusImpl(
        asAuthUser(admin.id, c1.id, 'ADMIN'),
        { userId: stranger.id, status: 'BLOCKED' },
      ),
    ).rejects.toThrow('Користувача не знайдено')
  })

  it('MANAGER не може блокувати нікого', async () => {
    const company = await createTestCompany()
    const m = await createTestUser(company.id, { role: 'MANAGER' })
    const c = await createTestUser(company.id, { role: 'CASHIER' })

    await expect(
      setUserStatusImpl(
        asAuthUser(m.id, company.id, 'MANAGER'),
        { userId: c.id, status: 'BLOCKED' },
      ),
    ).rejects.toThrow('Недостатньо прав')
  })

  it('SUPER_ADMIN не може змінити статус Супер-адміна', async () => {
    const company = await createTestCompany()
    const sa1 = await createTestUser(company.id, { role: 'SUPER_ADMIN' })
    const sa2 = await createTestUser(company.id, { role: 'SUPER_ADMIN' })

    await expect(
      setUserStatusImpl(
        asAuthUser(sa1.id, company.id, 'SUPER_ADMIN'),
        { userId: sa2.id, status: 'BLOCKED' },
      ),
    ).rejects.toThrow('Не можна змінити статус Супер-адміна')
  })
})

describe('createStaffMemberImpl', () => {
  afterEach(async () => {
    await cleanupTestCompanies()
  })

  it('створює користувача і привʼязує до кількох магазинів', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const s1 = await createTestStore(company.id, { name: 'S1' })
    const s2 = await createTestStore(company.id, { name: 'S2' })

    const result = await createStaffMemberImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      {
        firstName: 'Іван',
        lastName: 'Петренко',
        email: uniqueEmail(),
        password: 'password123',
        role: 'CASHIER',
        storeIds: [s1.id, s2.id],
      },
    )

    const links = await prisma.managerStore.findMany({
      where: { userId: result.id },
      select: { storeId: true },
    })
    expect(links.map(l => l.storeId).sort()).toEqual([s1.id, s2.id].sort())
  })

  it('створює користувача без привʼязок при storeIds: []', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    const result = await createStaffMemberImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      {
        firstName: 'A', lastName: 'B', email: uniqueEmail(),
        password: 'password123', role: 'SALESPERSON', storeIds: [],
      },
    )

    const links = await prisma.managerStore.findMany({ where: { userId: result.id } })
    expect(links).toEqual([])
  })

  it('відкочує транзакцію якщо один з магазинів чужий', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const ownStore = await createTestStore(c1.id)
    const otherStore = await createTestStore(c2.id)

    await expect(
      createStaffMemberImpl(
        asAuthUser(admin.id, c1.id, 'ADMIN'),
        {
          firstName: 'A', lastName: 'B', email: uniqueEmail(),
          password: 'password123', role: 'CASHIER',
          storeIds: [ownStore.id, otherStore.id],
        },
      ),
    ).rejects.toThrow('Магазин не знайдено')

    const created = await prisma.user.findFirst({
      where: { companyId: c1.id, firstName: 'A', lastName: 'B' },
    })
    expect(created).toBeNull()
  })

  it('створює користувача з role SALESPERSON', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    const result = await createStaffMemberImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      {
        firstName: 'P', lastName: 'S', email: uniqueEmail(),
        password: 'password123', role: 'SALESPERSON', storeIds: [],
      },
    )
    const u = await prisma.user.findUniqueOrThrow({ where: { id: result.id } })
    expect(u.role).toBe('SALESPERSON')
  })

  it('забороняє створити SUPER_ADMIN', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    await expect(
      createStaffMemberImpl(
        asAuthUser(admin.id, company.id, 'ADMIN'),
        {
          firstName: 'A', lastName: 'B', email: uniqueEmail(),
          password: 'password123', role: 'SUPER_ADMIN', storeIds: [],
        },
      ),
    ).rejects.toThrow('Не можна створити Супер-адміна')
  })

  it('ADMIN не може створити іншого ADMIN', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })

    await expect(
      createStaffMemberImpl(
        asAuthUser(admin.id, company.id, 'ADMIN'),
        {
          firstName: 'A', lastName: 'B', email: uniqueEmail(),
          password: 'password123', role: 'ADMIN', storeIds: [],
        },
      ),
    ).rejects.toThrow('Адмін не може створити іншого адміна')
  })
})
