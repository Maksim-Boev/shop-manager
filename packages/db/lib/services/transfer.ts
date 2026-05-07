import { prisma } from '../prisma'
import type { AuthUser } from '../auth'

export interface ICreateTransferInput {
  sourceStoreId: string
  destinationStoreId: string
  items: { productId: string; quantity: number }[]
}

export interface ITransferIdInput {
  transferId: string
}

const ensureAdmin = (actor: AuthUser): void => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }
}

export const createTransferImpl = async (
  actor: AuthUser,
  input: ICreateTransferInput,
): Promise<{ id: string }> => {
  ensureAdmin(actor)

  if (input.sourceStoreId === input.destinationStoreId) {
    throw new Error('Джерело й приймач мають відрізнятись')
  }
  if (input.items.length === 0) {
    throw new Error('Додайте хоча б одну позицію')
  }
  for (const item of input.items) {
    if (!(item.quantity > 0)) {
      throw new Error('Кількість має бути більше нуля')
    }
  }

  const companyId = actor.companyId ?? ''

  const stores = await prisma.store.findMany({
    where: {
      id: { in: [input.sourceStoreId, input.destinationStoreId] },
      companyId,
    },
    select: { id: true },
  })
  if (stores.length !== 2) throw new Error('Один з магазинів не знайдено в компанії')

  const productIds = input.items.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, companyId },
    select: { id: true },
  })
  if (products.length !== productIds.length) {
    throw new Error('Товар не знайдено в компанії')
  }

  return prisma.stockTransfer.create({
    data: {
      companyId,
      sourceStoreId: input.sourceStoreId,
      destinationStoreId: input.destinationStoreId,
      createdByUserId: actor.id,
      state: 'DRAFT',
      items: {
        create: input.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity.toString(),
        })),
      },
    },
    select: { id: true },
  })
}

export const completeTransferImpl = async (
  actor: AuthUser,
  input: ITransferIdInput,
): Promise<void> => {
  ensureAdmin(actor)
  const companyId = actor.companyId ?? ''

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: input.transferId, companyId },
    select: {
      id: true,
      state: true,
      sourceStoreId: true,
      destinationStoreId: true,
      items: true,
    },
  })
  if (!transfer) throw new Error('Переміщення не знайдено')
  if (transfer.state !== 'IN_TRANSIT') {
    throw new Error('Завершити можна лише переміщення в стані IN_TRANSIT')
  }

  await prisma.$transaction(async tx => {
    for (const item of transfer.items) {
      const src = await tx.storeProduct.findUnique({
        where: {
          storeId_productId: {
            storeId: transfer.sourceStoreId,
            productId: item.productId,
          },
        },
      })
      if (!src || src.stock.lt(item.quantity)) {
        throw new Error(`Недостатній залишок для товару ${item.productId}`)
      }

      await tx.storeProduct.update({
        where: { id: src.id },
        data: { stock: { decrement: item.quantity } },
      })

      await tx.storeProduct.upsert({
        where: {
          storeId_productId: {
            storeId: transfer.destinationStoreId,
            productId: item.productId,
          },
        },
        create: {
          storeId: transfer.destinationStoreId,
          productId: item.productId,
          stock: item.quantity,
        },
        update: { stock: { increment: item.quantity } },
      })

      await tx.stockMovement.createMany({
        data: [
          {
            companyId,
            storeId: transfer.sourceStoreId,
            productId: item.productId,
            quantity: item.quantity.negated(),
            type: 'TRANSFER_OUT',
            stockTransferItemId: item.id,
          },
          {
            companyId,
            storeId: transfer.destinationStoreId,
            productId: item.productId,
            quantity: item.quantity,
            type: 'TRANSFER_IN',
            stockTransferItemId: item.id,
          },
        ],
      })
    }

    await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { state: 'COMPLETED', completedAt: new Date() },
    })
  })
}

export const cancelTransferImpl = async (
  actor: AuthUser,
  input: ITransferIdInput,
): Promise<void> => {
  ensureAdmin(actor)
  const companyId = actor.companyId ?? ''

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: input.transferId, companyId },
    select: { id: true, state: true },
  })
  if (!transfer) throw new Error('Переміщення не знайдено')
  if (transfer.state !== 'DRAFT') {
    throw new Error('Скасувати можна лише чернетку')
  }

  await prisma.stockTransfer.update({
    where: { id: transfer.id },
    data: { state: 'CANCELLED' },
  })
}
