import { describe, it, expect } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestProduct,
} from '../helpers'
import { createManualAdjustmentImpl } from '../../lib/services/manual-adjustment'

describe('createManualAdjustmentImpl', () => {

  it('надходження: StoreProduct не існує → створює з stock = quantity', async () => {
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { role: 'MANAGER' })
    const store = await createTestStore(company.id)
    const cat = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, cat.id)

    await createManualAdjustmentImpl({
      companyId: company.id,
      storeId: store.id,
      productId: product.id,
      quantity: 10,
      reason: 'Первинне заповнення',
      userId: user.id,
    })

    const sp = await prisma.storeProduct.findUniqueOrThrow({
      where: { storeId_productId: { storeId: store.id, productId: product.id } },
    })
    expect(Number(sp.stock)).toBe(10)

    const adjustment = await prisma.manualAdjustment.findFirst({
      where: { storeId: store.id, productId: product.id },
    })
    expect(adjustment).not.toBeNull()
    expect(Number(adjustment!.quantity)).toBe(10)

    const movement = await prisma.stockMovement.findFirst({
      where: { manualAdjustmentId: adjustment!.id },
    })
    expect(movement).not.toBeNull()
    expect(movement!.type).toBe('MANUAL_ADJUST')
    expect(Number(movement!.quantity)).toBe(10)
  })

  it('списання: зменшує існуючий залишок', async () => {
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { role: 'MANAGER' })
    const store = await createTestStore(company.id)
    const cat = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, cat.id)

    await prisma.storeProduct.create({
      data: { storeId: store.id, productId: product.id, stock: '50' },
    })

    await createManualAdjustmentImpl({
      companyId: company.id,
      storeId: store.id,
      productId: product.id,
      quantity: -15,
      reason: 'Інвентаризація',
      userId: user.id,
    })

    const sp = await prisma.storeProduct.findUniqueOrThrow({
      where: { storeId_productId: { storeId: store.id, productId: product.id } },
    })
    expect(Number(sp.stock)).toBe(35)
  })

  it('від\'ємний залишок → кидає помилку', async () => {
    const company = await createTestCompany()
    const user = await createTestUser(company.id, { role: 'MANAGER' })
    const store = await createTestStore(company.id)
    const cat = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, cat.id)

    await prisma.storeProduct.create({
      data: { storeId: store.id, productId: product.id, stock: '5' },
    })

    await expect(
      createManualAdjustmentImpl({
        companyId: company.id,
        storeId: store.id,
        productId: product.id,
        quantity: -10,
        reason: 'Спроба мінусового залишку',
        userId: user.id,
      }),
    ).rejects.toThrow(/від.ємним/)
  })

  it('IDOR: чужий магазин → кидає помилку', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const user = await createTestUser(c1.id, { role: 'MANAGER' })
    const otherStore = await createTestStore(c2.id)
    const cat = await createTestCategory(c1.id)
    const product = await createTestProduct(c1.id, cat.id)

    await expect(
      createManualAdjustmentImpl({
        companyId: c1.id,
        storeId: otherStore.id,
        productId: product.id,
        quantity: 5,
        reason: 'IDOR спроба',
        userId: user.id,
      }),
    ).rejects.toThrow(/Магазин не знайдено/)
  })

  it('IDOR: чужий товар → кидає помилку', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const user = await createTestUser(c1.id, { role: 'MANAGER' })
    const store = await createTestStore(c1.id)
    const cat2 = await createTestCategory(c2.id)
    const otherProduct = await createTestProduct(c2.id, cat2.id)

    await expect(
      createManualAdjustmentImpl({
        companyId: c1.id,
        storeId: store.id,
        productId: otherProduct.id,
        quantity: 5,
        reason: 'IDOR спроба',
        userId: user.id,
      }),
    ).rejects.toThrow(/Товар не знайдено/)
  })
})
