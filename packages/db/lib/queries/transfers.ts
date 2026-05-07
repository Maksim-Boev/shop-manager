import { prisma } from '../prisma'
import type { TransferState, ProductUnit } from '@/generated/prisma/enums'

export interface ITransferRow {
  id: string
  state: TransferState
  sourceStoreName: string
  destinationStoreName: string
  itemsCount: number
  createdAt: Date
  completedAt: Date | null
}

export interface ITransferableStore {
  id: string
  name: string
  type: 'SHOP' | 'WAREHOUSE'
}

export interface IStoreProductOption {
  productId: string
  sku: string
  name: string
  unit: ProductUnit
  stock: number
}

export const getTransfers = async (
  companyId: string,
  state?: TransferState,
): Promise<ITransferRow[]> => {
  const transfers = await prisma.stockTransfer.findMany({
    where: {
      companyId,
      ...(state ? { state } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      state: true,
      createdAt: true,
      completedAt: true,
      sourceStoreId: true,
      destinationStoreId: true,
      _count: { select: { items: true } },
    },
    take: 100,
  })

  if (transfers.length === 0) return []

  const storeIds = Array.from(new Set([
    ...transfers.map(t => t.sourceStoreId),
    ...transfers.map(t => t.destinationStoreId),
  ]))
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds }, companyId },
    select: { id: true, name: true },
  })
  const nameMap = new Map(stores.map(s => [s.id, s.name]))

  return transfers.map(t => ({
    id: t.id,
    state: t.state,
    sourceStoreName: nameMap.get(t.sourceStoreId) ?? t.sourceStoreId,
    destinationStoreName: nameMap.get(t.destinationStoreId) ?? t.destinationStoreId,
    itemsCount: t._count.items,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  }))
}

export const getTransferableStores = async (
  companyId: string,
): Promise<ITransferableStore[]> =>
  prisma.store.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: { id: true, name: true, type: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

export const getStoreProductsForTransfer = async (
  storeId: string,
  companyId: string,
): Promise<IStoreProductOption[]> => {
  const store = await prisma.store.findFirst({
    where: { id: storeId, companyId },
    select: { id: true },
  })
  if (!store) return []

  const rows = await prisma.storeProduct.findMany({
    where: { storeId, product: { companyId, status: 'ACTIVE' } },
    select: {
      productId: true,
      stock: true,
      product: { select: { sku: true, name: true, unit: true } },
    },
  })

  return rows
    .map(r => ({
      productId: r.productId,
      sku: r.product.sku,
      name: r.product.name,
      unit: r.product.unit,
      stock: Number(r.stock),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}
