import { prisma } from '../prisma'
import type { ProductUnit, ProductStatus } from '@/generated/prisma/enums'

export interface IProductRow {
  id: string
  sku: string
  name: string
  unit: ProductUnit
  basePrice: number
  costPrice: number | null
  categoryId: string
  categoryName: string
  status: ProductStatus
  storesCount: number
}

export interface IProductStoreRow {
  storeId: string
  storeName: string
  stock: number
  priceOverride: number | null
  effectivePrice: number
  isAvailable: boolean
}

export interface IProductDetail {
  id: string
  sku: string
  name: string
  unit: ProductUnit
  basePrice: number
  costPrice: number | null
  status: ProductStatus
  categoryId: string
  categoryName: string
  subcategoryId: string | null
  subcategoryName: string | null
  taxRateId: string
  taxRateName: string
  taxRate: number
  createdAt: Date
  stores: IProductStoreRow[]
}

export interface ICategoryWithSubs {
  id: string
  name: string
  sortOrder: number
  subcategories: { id: string; name: string; sortOrder: number }[]
}

export interface ITaxRate {
  id: string
  name: string
  rate: number
  isDefault: boolean
}

export const getProducts = async (companyId: string): Promise<IProductRow[]> => {
  const products = await prisma.product.findMany({
    where: { companyId },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      basePrice: true,
      costPrice: true,
      categoryId: true,
      category: { select: { name: true } },
      status: true,
      _count: { select: { storeProducts: true } },
    },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  })

  return products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    basePrice: Number(p.basePrice),
    costPrice: p.costPrice !== null ? Number(p.costPrice) : null,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    status: p.status,
    storesCount: p._count.storeProducts,
  }))
}

export const getProductDetail = async (
  productId: string,
  companyId: string,
): Promise<IProductDetail | null> => {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      basePrice: true,
      costPrice: true,
      status: true,
      categoryId: true,
      category: { select: { name: true } },
      subcategoryId: true,
      subcategory: { select: { name: true } },
      taxRateId: true,
      taxRate: { select: { name: true, rate: true } },
      createdAt: true,
      storeProducts: {
        select: {
          storeId: true,
          store: { select: { name: true } },
          stock: true,
          priceOverride: true,
          isAvailable: true,
        },
        orderBy: { store: { name: 'asc' } },
      },
    },
  })

  if (!product) return null

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    basePrice: Number(product.basePrice),
    costPrice: product.costPrice !== null ? Number(product.costPrice) : null,
    status: product.status,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    subcategoryId: product.subcategoryId,
    subcategoryName: product.subcategory?.name ?? null,
    taxRateId: product.taxRateId,
    taxRateName: product.taxRate.name,
    taxRate: Number(product.taxRate.rate),
    createdAt: product.createdAt,
    stores: product.storeProducts.map(sp => ({
      storeId: sp.storeId,
      storeName: sp.store.name,
      stock: Number(sp.stock),
      priceOverride: sp.priceOverride !== null ? Number(sp.priceOverride) : null,
      effectivePrice: sp.priceOverride !== null
        ? Number(sp.priceOverride)
        : Number(product.basePrice),
      isAvailable: sp.isAvailable,
    })),
  }
}

export const getCategories = async (companyId: string): Promise<ICategoryWithSubs[]> => {
  const categories = await prisma.category.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      subcategories: {
        select: { id: true, name: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return categories
}

export const getTaxRates = async (companyId: string): Promise<ITaxRate[]> => {
  const rates = await prisma.taxRate.findMany({
    where: { companyId },
    select: { id: true, name: true, rate: true, isDefault: true },
    orderBy: { name: 'asc' },
  })

  return rates.map(r => ({
    id: r.id,
    name: r.name,
    rate: Number(r.rate),
    isDefault: r.isDefault,
  }))
}
