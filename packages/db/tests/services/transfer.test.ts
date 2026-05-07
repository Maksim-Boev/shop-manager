import { describe, it, expect } from 'vitest'
import { prisma } from '../../lib/prisma'
import {
  createTestCompany, createTestStore, createTestUser,
  createTestCategory, createTestProduct,
} from '../helpers'
import type { AuthUser } from '../../lib/auth'
import {
  createTransferImpl,
  completeTransferImpl,
  cancelTransferImpl,
} from '../../lib/services/transfer'

const asAdmin = (id: string, companyId: string): AuthUser => ({
  id,
  companyId,
  role: 'ADMIN',
  firstName: 'A',
  lastName: 'A',
})

describe('transfer service (impl)', () => {

  it('createTransferImpl — sourceId === destinationId → помилка', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const store = await createTestStore(company.id)
    const cat = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, cat.id)

    await expect(
      createTransferImpl(asAdmin(admin.id, company.id), {
        sourceStoreId: store.id,
        destinationStoreId: store.id,
        items: [{ productId: product.id, quantity: 1 }],
      }),
    ).rejects.toThrow(/відрізнятись/)
  })

  it('createTransferImpl — чужий склад → помилка', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const myStore = await createTestStore(c1.id)
    const otherStore = await createTestStore(c2.id)
    const cat = await createTestCategory(c1.id)
    const product = await createTestProduct(c1.id, cat.id)

    await expect(
      createTransferImpl(asAdmin(admin.id, c1.id), {
        sourceStoreId: myStore.id,
        destinationStoreId: otherStore.id,
        items: [{ productId: product.id, quantity: 1 }],
      }),
    ).rejects.toThrow(/Один з магазинів не знайдено/)
  })

  it('completeTransferImpl — стан DRAFT → помилка', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const src = await createTestStore(company.id, { name: 'Src', type: 'WAREHOUSE' })
    const dst = await createTestStore(company.id, { name: 'Dst', type: 'SHOP' })
    const transfer = await prisma.stockTransfer.create({
      data: {
        companyId: company.id,
        sourceStoreId: src.id,
        destinationStoreId: dst.id,
        createdByUserId: admin.id,
        state: 'DRAFT',
      },
    })

    await expect(
      completeTransferImpl(asAdmin(admin.id, company.id), { transferId: transfer.id }),
    ).rejects.toThrow(/IN_TRANSIT/)
  })

  it('completeTransferImpl — IN_TRANSIT → COMPLETED, рухи створено', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const src = await createTestStore(company.id, { name: 'Src', type: 'WAREHOUSE' })
    const dst = await createTestStore(company.id, { name: 'Dst', type: 'SHOP' })
    const cat = await createTestCategory(company.id)
    const product = await createTestProduct(company.id, cat.id)

    await prisma.storeProduct.create({
      data: { storeId: src.id, productId: product.id, stock: '100' },
    })

    const transfer = await prisma.stockTransfer.create({
      data: {
        companyId: company.id,
        sourceStoreId: src.id,
        destinationStoreId: dst.id,
        createdByUserId: admin.id,
        state: 'IN_TRANSIT',
        items: { create: [{ productId: product.id, quantity: '15' }] },
      },
    })

    await completeTransferImpl(
      asAdmin(admin.id, company.id),
      { transferId: transfer.id },
    )

    const reloaded = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transfer.id },
    })
    expect(reloaded.state).toBe('COMPLETED')
    expect(reloaded.completedAt).not.toBeNull()

    const srcStock = await prisma.storeProduct.findUniqueOrThrow({
      where: { storeId_productId: { storeId: src.id, productId: product.id } },
    })
    expect(srcStock.stock.toString()).toBe('85')

    const dstStock = await prisma.storeProduct.findUniqueOrThrow({
      where: { storeId_productId: { storeId: dst.id, productId: product.id } },
    })
    expect(dstStock.stock.toString()).toBe('15')

    const movements = await prisma.stockMovement.findMany({
      where: { stockTransferItem: { stockTransferId: transfer.id } },
      orderBy: { type: 'asc' },
    })
    expect(movements.length).toBe(2)
    expect(movements.find(m => m.type === 'TRANSFER_OUT')?.storeId).toBe(src.id)
    expect(movements.find(m => m.type === 'TRANSFER_IN')?.storeId).toBe(dst.id)
  })

  it('cancelTransferImpl — IN_TRANSIT → помилка (тільки DRAFT)', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const src = await createTestStore(company.id, { name: 'Src', type: 'WAREHOUSE' })
    const dst = await createTestStore(company.id, { name: 'Dst', type: 'SHOP' })
    const transfer = await prisma.stockTransfer.create({
      data: {
        companyId: company.id,
        sourceStoreId: src.id,
        destinationStoreId: dst.id,
        createdByUserId: admin.id,
        state: 'IN_TRANSIT',
      },
    })

    await expect(
      cancelTransferImpl(asAdmin(admin.id, company.id), { transferId: transfer.id }),
    ).rejects.toThrow(/чернетку/)
  })

  it('completeTransferImpl — чужа компанія → помилка', async () => {
    const c1 = await createTestCompany()
    const c2 = await createTestCompany()
    const admin = await createTestUser(c1.id, { role: 'ADMIN' })
    const otherAdmin = await createTestUser(c2.id, { role: 'ADMIN' })
    const src = await createTestStore(c2.id, { name: 'Src', type: 'WAREHOUSE' })
    const dst = await createTestStore(c2.id, { name: 'Dst', type: 'SHOP' })
    const transfer = await prisma.stockTransfer.create({
      data: {
        companyId: c2.id,
        sourceStoreId: src.id,
        destinationStoreId: dst.id,
        createdByUserId: otherAdmin.id,
        state: 'IN_TRANSIT',
      },
    })

    await expect(
      completeTransferImpl(asAdmin(admin.id, c1.id), { transferId: transfer.id }),
    ).rejects.toThrow(/не знайдено/)
  })

  it('cancelTransferImpl — DRAFT → CANCELLED', async () => {
    const company = await createTestCompany()
    const admin = await createTestUser(company.id, { role: 'ADMIN' })
    const src = await createTestStore(company.id, { name: 'Src', type: 'WAREHOUSE' })
    const dst = await createTestStore(company.id, { name: 'Dst', type: 'SHOP' })
    const transfer = await prisma.stockTransfer.create({
      data: {
        companyId: company.id,
        sourceStoreId: src.id,
        destinationStoreId: dst.id,
        createdByUserId: admin.id,
        state: 'DRAFT',
      },
    })

    await cancelTransferImpl(asAdmin(admin.id, company.id), { transferId: transfer.id })

    const reloaded = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transfer.id },
    })
    expect(reloaded.state).toBe('CANCELLED')
  })
})
