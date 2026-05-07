import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { setUserStatusImpl } from '../../lib/services/staff'
import {
  createTestCompany,
  createTestUser,
  cleanupTestCompanies,
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
