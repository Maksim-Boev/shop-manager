import { prisma } from '../prisma'

export interface ICreateManualAdjustmentInput {
  companyId: string
  storeId: string
  productId: string
  quantity: number
  reason: string
  userId: string
}

export const createManualAdjustmentImpl = async (
  input: ICreateManualAdjustmentInput,
): Promise<void> => {
  const store = await prisma.store.findFirst({
    where: { id: input.storeId, companyId: input.companyId },
    select: { id: true },
  })
  if (!store) throw new Error('Магазин не знайдено')

  const product = await prisma.product.findFirst({
    where: { id: input.productId, companyId: input.companyId },
    select: { id: true },
  })
  if (!product) throw new Error('Товар не знайдено')

  const storeProduct = await prisma.storeProduct.findUnique({
    where: { storeId_productId: { storeId: input.storeId, productId: input.productId } },
    select: { stock: true },
  })

  const currentStock = Number(storeProduct?.stock ?? 0)
  if (currentStock + input.quantity < 0) {
    throw new Error("Залишок не може бути від'ємним")
  }

  await prisma.$transaction(async (tx) => {
    const adjustment = await tx.manualAdjustment.create({
      data: {
        companyId: input.companyId,
        storeId: input.storeId,
        productId: input.productId,
        quantity: input.quantity,
        reason: input.reason,
        createdByUserId: input.userId,
      },
      select: { id: true },
    })

    await tx.stockMovement.create({
      data: {
        companyId: input.companyId,
        storeId: input.storeId,
        productId: input.productId,
        quantity: input.quantity,
        type: 'MANUAL_ADJUST',
        manualAdjustmentId: adjustment.id,
      },
    })

    await tx.storeProduct.upsert({
      where: { storeId_productId: { storeId: input.storeId, productId: input.productId } },
      create: {
        storeId: input.storeId,
        productId: input.productId,
        stock: input.quantity,
        isAvailable: true,
      },
      update: { stock: { increment: input.quantity } },
    })
  })
}
