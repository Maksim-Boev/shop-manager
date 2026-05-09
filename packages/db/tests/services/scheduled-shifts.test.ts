import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createScheduledShiftsImpl } from '../../lib/services/scheduled-shifts'
import {
  createTestCompany, createTestStore, createTestUser, cleanupTestCompanies,
} from '../helpers'
import type { AuthUser } from '../../lib/auth'

const asAuthUser = (
  id: string, companyId: string | null, role: AuthUser['role'],
): AuthUser => ({ id, companyId, role, firstName: 'A', lastName: 'A' })

const SLOT = {
  startsAt: new Date('2026-06-01T09:00:00Z'),
  endsAt: new Date('2026-06-01T17:00:00Z'),
}

describe('createScheduledShiftsImpl', () => {
  afterEach(async () => {
    await cleanupTestCompanies()
  })

  it('один userId → 1 запис із isShiftLeader=true', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const store = await createTestStore(company.id)
    const u = await createTestUser(company.id, { role: 'CASHIER' })

    const { ids } = await createScheduledShiftsImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      { shopId: store.id, userIds: [u.id], ...SLOT },
    )
    expect(ids).toHaveLength(1)
    const row = await prisma.scheduledShift.findUniqueOrThrow({ where: { id: ids[0] } })
    expect(row.isShiftLeader).toBe(true)
    expect(row.userId).toBe(u.id)
  })

  it('кілька userIds + leaderUserId → лише вказаний має isShiftLeader', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const store = await createTestStore(company.id)
    const u1 = await createTestUser(company.id, { role: 'CASHIER' })
    const u2 = await createTestUser(company.id, { role: 'CASHIER' })
    const u3 = await createTestUser(company.id, { role: 'SALESPERSON' })

    const { ids } = await createScheduledShiftsImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      {
        shopId: store.id, userIds: [u1.id, u2.id, u3.id], ...SLOT,
        leaderUserId: u2.id,
      },
    )
    expect(ids).toHaveLength(3)
    const rows = await prisma.scheduledShift.findMany({ where: { id: { in: ids } } })
    const leader = rows.find(r => r.isShiftLeader)
    expect(leader?.userId).toBe(u2.id)
    expect(rows.filter(r => r.isShiftLeader).length).toBe(1)
  })

  it('leaderUserId не з userIds → помилка, нічого не створено', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const store = await createTestStore(company.id)
    const u1 = await createTestUser(company.id, { role: 'CASHIER' })
    const u2 = await createTestUser(company.id, { role: 'CASHIER' })

    await expect(
      createScheduledShiftsImpl(
        asAuthUser(admin.id, company.id, 'ADMIN'),
        {
          shopId: store.id, userIds: [u1.id], ...SLOT,
          leaderUserId: u2.id,
        },
      ),
    ).rejects.toThrow()
    const all = await prisma.scheduledShift.findMany({ where: { storeId: store.id } })
    expect(all).toHaveLength(0)
  })

  it('знімає isShiftLeader з пересічних змін магазину', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const store = await createTestStore(company.id)
    const oldLeader = await createTestUser(company.id, { role: 'CASHIER' })
    const newUser = await createTestUser(company.id, { role: 'CASHIER' })

    const old = await prisma.scheduledShift.create({
      data: {
        companyId: company.id, storeId: store.id, userId: oldLeader.id,
        startsAt: SLOT.startsAt, endsAt: SLOT.endsAt, isShiftLeader: true,
        createdByUserId: admin.id,
      },
    })

    await createScheduledShiftsImpl(
      asAuthUser(admin.id, company.id, 'ADMIN'),
      {
        shopId: store.id, userIds: [newUser.id],
        startsAt: new Date('2026-06-01T12:00:00Z'),
        endsAt: new Date('2026-06-01T20:00:00Z'),
      },
    )

    const oldReloaded = await prisma.scheduledShift.findUniqueOrThrow({ where: { id: old.id } })
    expect(oldReloaded.isShiftLeader).toBe(false)
  })

  it('IDOR — userIds іншої компанії', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const store = await createTestStore(c1.id)
    const stranger = await createTestUser(c2.id, { role: 'CASHIER' })

    await expect(
      createScheduledShiftsImpl(
        asAuthUser(admin.id, c1.id, 'ADMIN'),
        { shopId: store.id, userIds: [stranger.id], ...SLOT },
      ),
    ).rejects.toThrow()
  })

  it('CASHIER не може створювати графік', async () => {
    const company = await createTestCompany()
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })
    const store = await createTestStore(company.id)
    const u = await createTestUser(company.id, { role: 'CASHIER' })

    await expect(
      createScheduledShiftsImpl(
        asAuthUser(cashier.id, company.id, 'CASHIER'),
        { shopId: store.id, userIds: [u.id], ...SLOT },
      ),
    ).rejects.toThrow('Недостатньо прав')
  })

  it('IDOR — shopId іншої компанії', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const ownUser = await createTestUser(c1.id, { role: 'CASHIER' })
    const otherStore = await createTestStore(c2.id)

    await expect(
      createScheduledShiftsImpl(
        asAuthUser(admin.id, c1.id, 'ADMIN'),
        { shopId: otherStore.id, userIds: [ownUser.id], ...SLOT },
      ),
    ).rejects.toThrow('Магазин не знайдено')
  })

  it('MANAGER без ManagerStore link → відмова', async () => {
    const company = await createTestCompany()
    const manager = await createTestUser(company.id, { role: 'MANAGER' })
    const store = await createTestStore(company.id)
    const cashier = await createTestUser(company.id, { role: 'CASHIER' })

    await expect(
      createScheduledShiftsImpl(
        asAuthUser(manager.id, company.id, 'MANAGER'),
        { shopId: store.id, userIds: [cashier.id], ...SLOT },
      ),
    ).rejects.toThrow('Магазин не закріплений за вами')
  })
})
