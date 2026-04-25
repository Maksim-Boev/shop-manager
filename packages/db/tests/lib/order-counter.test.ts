import { describe, expect, it } from 'vitest'
import { prisma } from '../../lib/prisma'
import { getNextOrderNumber } from '../../lib/order-counter'
import { createTestCompany, createTestStore } from '../helpers'

describe('getNextOrderNumber', () => {
  it('первый вызов возвращает 1', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)

    const n = await prisma.$transaction(async (tx) => getNextOrderNumber(tx, store.id))
    expect(n).toBe(1)
  })

  it('каждый вызов возвращает следующий номер', async () => {
    const company = await createTestCompany()
    const store = await createTestStore(company.id)

    const n1 = await prisma.$transaction((tx) => getNextOrderNumber(tx, store.id))
    const n2 = await prisma.$transaction((tx) => getNextOrderNumber(tx, store.id))
    const n3 = await prisma.$transaction((tx) => getNextOrderNumber(tx, store.id))

    expect(n1).toBe(1)
    expect(n2).toBe(2)
    expect(n3).toBe(3)
  })

  it('счётчики разных магазинов независимы', async () => {
    const company = await createTestCompany()
    const store1 = await createTestStore(company.id, { name: 'S1' })
    const store2 = await createTestStore(company.id, { name: 'S2' })

    const [n1, n2] = await Promise.all([
      prisma.$transaction((tx) => getNextOrderNumber(tx, store1.id)),
      prisma.$transaction((tx) => getNextOrderNumber(tx, store2.id)),
    ])

    expect(n1).toBe(1)
    expect(n2).toBe(1)
  })
})
