'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'

const ALLOWED_ROLES = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'] as const
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const

const UpdateProductSchema = z.object({
  productId: z.string().min(1),
  basePrice: z.coerce.number().nonnegative(),
  costPrice: z.union([z.coerce.number().nonnegative(), z.null()]),
})

export const updateProduct = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number]) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = UpdateProductSchema.parse(input)

  const product = await prisma.product.findFirst({
    where: { id: data.productId, companyId: session.user.companyId },
    select: { id: true },
  })
  if (!product) throw new Error('Товар не знайдений')

  await prisma.product.update({
    where: { id: data.productId },
    data: {
      basePrice: data.basePrice.toFixed(2),
      costPrice: data.costPrice === null ? null : data.costPrice.toFixed(2),
    },
  })

  revalidatePath('/shops/[shopId]', 'page')
  revalidatePath('/shops')
  revalidatePath('/products')
}

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  unit: z.enum(['PIECE', 'KG', 'GRAM', 'LITER', 'MILLILITER', 'METER', 'PACK']),
  basePrice: z.coerce.number().nonnegative(),
  costPrice: z.union([z.coerce.number().nonnegative(), z.null()]),
  taxRateId: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().nullable().optional(),
})

export const createProduct = async (input: unknown): Promise<{ id: string }> => {
  const session = await auth()
  if (
    !session ||
    !ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number]) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const companyId = session.user.companyId
  const data = CreateProductSchema.parse(input)

  const [taxRate, category] = await Promise.all([
    prisma.taxRate.findFirst({ where: { id: data.taxRateId, companyId }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: data.categoryId, companyId }, select: { id: true } }),
  ])

  if (!taxRate) throw new Error('Ставка ПДВ не знайдена')
  if (!category) throw new Error('Категорія не знайдена')

  if (data.subcategoryId) {
    const sub = await prisma.subcategory.findFirst({
      where: { id: data.subcategoryId, categoryId: data.categoryId },
      select: { id: true },
    })
    if (!sub) throw new Error('Підкатегорія не знайдена')
  }

  const product = await prisma.product.create({
    data: {
      companyId,
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      basePrice: data.basePrice.toFixed(2),
      costPrice: data.costPrice === null ? null : data.costPrice.toFixed(2),
      taxRateId: data.taxRateId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? null,
    },
    select: { id: true },
  })

  revalidatePath('/products')
  return { id: product.id }
}

const ArchiveProductSchema = z.object({
  productId: z.string().min(1),
})

export const archiveProduct = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    !ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number]) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const data = ArchiveProductSchema.parse(input)

  const product = await prisma.product.findFirst({
    where: { id: data.productId, companyId: session.user.companyId },
    select: { id: true, status: true },
  })
  if (!product) throw new Error('Товар не знайдений')
  if (product.status === 'ARCHIVED') throw new Error('Товар вже в архіві')

  await prisma.product.update({
    where: { id: data.productId },
    data: { status: 'ARCHIVED' },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${data.productId}`)
}

const UpdateProductInfoSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  unit: z.enum(['PIECE', 'KG', 'GRAM', 'LITER', 'MILLILITER', 'METER', 'PACK']),
  basePrice: z.coerce.number().nonnegative(),
  costPrice: z.union([z.coerce.number().nonnegative(), z.null()]),
  taxRateId: z.string().min(1),
  categoryId: z.string().min(1),
  subcategoryId: z.string().nullable().optional(),
})

export const updateProductInfo = async (input: unknown): Promise<void> => {
  const session = await auth()
  if (
    !session ||
    !ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number]) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }

  const companyId = session.user.companyId
  const data = UpdateProductInfoSchema.parse(input)

  const [product, taxRate, category] = await Promise.all([
    prisma.product.findFirst({ where: { id: data.productId, companyId }, select: { id: true } }),
    prisma.taxRate.findFirst({ where: { id: data.taxRateId, companyId }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: data.categoryId, companyId }, select: { id: true } }),
  ])

  if (!product) throw new Error('Товар не знайдений')
  if (!taxRate) throw new Error('Ставка ПДВ не знайдена')
  if (!category) throw new Error('Категорія не знайдена')

  if (data.subcategoryId) {
    const sub = await prisma.subcategory.findFirst({
      where: { id: data.subcategoryId, categoryId: data.categoryId },
      select: { id: true },
    })
    if (!sub) throw new Error('Підкатегорія не знайдена')
  }

  await prisma.product.update({
    where: { id: data.productId },
    data: {
      name: data.name,
      sku: data.sku,
      unit: data.unit,
      basePrice: data.basePrice.toFixed(2),
      costPrice: data.costPrice === null ? null : data.costPrice.toFixed(2),
      taxRateId: data.taxRateId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? null,
    },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${data.productId}`)
}
