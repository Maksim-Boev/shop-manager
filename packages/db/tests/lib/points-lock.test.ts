import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { withPointsLock } from '../../lib/points-lock'
import { createTestCompany, createTestCustomer } from '../helpers'

describe('withPointsLock', () => {
  it('выполняет функцию и возвращает результат', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)

    const result = await prisma.$transaction(async (tx) =>
      withPointsLock(tx, customer.id, async () => 'ok'),
    )
    expect(result).toBe('ok')
  })

  it('пробрасывает ошибку из fn', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)

    await expect(
      prisma.$transaction(async (tx) =>
        withPointsLock(tx, customer.id, async () => {
          throw new Error('точки закончились')
        }),
      ),
    ).rejects.toThrow('точки закончились')
  })

  it('два последовательных вызова для одного клиента не конфликтуют', async () => {
    const company = await createTestCompany()
    const customer = await createTestCustomer(company.id)

    const r1 = await prisma.$transaction((tx) => withPointsLock(tx, customer.id, async () => 1))
    const r2 = await prisma.$transaction((tx) => withPointsLock(tx, customer.id, async () => 2))

    expect(r1).toBe(1)
    expect(r2).toBe(2)
  })
})
