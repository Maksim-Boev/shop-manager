import { prisma } from '../prisma'
import type { ProductUnit, PurchaseOrderState } from '@/generated/prisma/enums'

export interface IWarehouseStore {
  id: string
  name: string
  address: string | null
}

export interface IWarehouseStockRow {
  productId: string
  sku: string
  name: string
  category: string
  unit: ProductUnit
  stock: number
  effectivePrice: number
  shopTotal: number
  totalQty: number
  totalValue: number
}

export interface IPurchaseOrderRow {
  id: string
  state: PurchaseOrderState
  destinationStoreId: string
  destinationStoreName: string
  supplierName: string | null
  itemsCount: number
  placedAt: Date | null
  createdAt: Date
}

export const getWarehouseStores = async (
  companyId: string,
): Promise<IWarehouseStore[]> =>
  prisma.store.findMany({
    where: { companyId, type: 'WAREHOUSE', status: 'ACTIVE' },
    select: { id: true, name: true, address: true },
    orderBy: { name: 'asc' },
  })

export const getWarehouseStock = async (
  storeId: string,
  companyId: string,
): Promise<IWarehouseStockRow[]> => {
  const store = await prisma.store.findFirst({
    where: { id: storeId, companyId, type: 'WAREHOUSE' },
    select: { id: true },
  })
  if (!store) return []

  const rows = await prisma.storeProduct.findMany({
    where: { storeId, product: { companyId } },
    select: {
      productId: true,
      stock: true,
      priceOverride: true,
      product: {
        select: {
          sku: true,
          name: true,
          unit: true,
          basePrice: true,
          category: { select: { name: true } },
        },
      },
    },
  })

  if (rows.length === 0) return []

  const productIds = rows.map(r => r.productId)

  // Сумарный остаток по каждому продукту во всех магазинах (тип SHOP)
  const shopStocks = await prisma.storeProduct.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      store: { companyId, type: 'SHOP', status: 'ACTIVE' },
    },
    _sum: { stock: true },
  })
  const shopMap = new Map(shopStocks.map(s => [s.productId, Number(s._sum.stock ?? 0)]))

  const mapped: IWarehouseStockRow[] = rows.map(r => {
    const whStock = Number(r.stock)
    const shopTotal = shopMap.get(r.productId) ?? 0
    const totalQty = whStock + shopTotal
    const effectivePrice = Number(r.priceOverride ?? r.product.basePrice)
    return {
      productId: r.productId,
      sku: r.product.sku,
      name: r.product.name,
      category: r.product.category.name,
      unit: r.product.unit,
      stock: whStock,
      effectivePrice,
      shopTotal,
      totalQty,
      totalValue: totalQty * effectivePrice,
    }
  })

  return mapped.sort((a, b) => {
    const ar = a.stock === 0 ? 0 : a.stock < 10 ? 1 : 2
    const br = b.stock === 0 ? 0 : b.stock < 10 ? 1 : 2
    if (ar !== br) return ar - br
    return a.name.localeCompare(b.name, 'uk')
  })
}

export const getPendingPurchaseOrders = async (
  companyId: string,
  warehouseId?: string,
): Promise<IPurchaseOrderRow[]> => {
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      companyId,
      state: { in: ['PLACED', 'PARTIALLY_RECEIVED'] },
      ...(warehouseId ? { destinationStoreId: warehouseId } : {}),
    },
    orderBy: { placedAt: 'desc' },
    select: {
      id: true,
      state: true,
      destinationStoreId: true,
      placedAt: true,
      createdAt: true,
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  if (orders.length === 0) return []

  const storeIds = Array.from(new Set(orders.map(o => o.destinationStoreId)))
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds }, companyId },
    select: { id: true, name: true },
  })
  const nameMap = new Map(stores.map(s => [s.id, s.name]))

  return orders.map(o => ({
    id: o.id,
    state: o.state,
    destinationStoreId: o.destinationStoreId,
    destinationStoreName: nameMap.get(o.destinationStoreId) ?? o.destinationStoreId,
    supplierName: o.supplier?.name ?? null,
    itemsCount: o._count.items,
    placedAt: o.placedAt,
    createdAt: o.createdAt,
  }))
}
