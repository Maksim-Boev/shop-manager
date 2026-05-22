'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@pkg/db'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
type TAdminRole = typeof ADMIN_ROLES[number]

const getAdminSession = async () => {
  const session = await auth()
  if (
    !session ||
    !ADMIN_ROLES.includes(session.user.role as TAdminRole) ||
    !session.user.companyId
  ) {
    throw new Error('Недостатньо прав')
  }
  return { companyId: session.user.companyId }
}

// ─── Category ────────────────────────────────────────────────────────────────

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
})

export const createCategory = async (input: unknown): Promise<{ id: string }> => {
  const { companyId } = await getAdminSession()
  const data = CreateCategorySchema.parse(input)

  const category = await prisma.category.create({
    data: { companyId, name: data.name, sortOrder: data.sortOrder },
    select: { id: true },
  })

  revalidatePath('/products')
  return { id: category.id }
}

const UpdateCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
})

export const updateCategory = async (input: unknown): Promise<void> => {
  const { companyId } = await getAdminSession()
  const data = UpdateCategorySchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, companyId },
    select: { id: true },
  })
  if (!category) throw new Error('Категорія не знайдена')

  await prisma.category.update({
    where: { id: data.categoryId },
    data: { name: data.name, sortOrder: data.sortOrder },
  })

  revalidatePath('/products')
}

const DeleteCategorySchema = z.object({
  categoryId: z.string().min(1),
})

export const deleteCategory = async (input: unknown): Promise<void> => {
  const { companyId } = await getAdminSession()
  const data = DeleteCategorySchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, companyId },
    select: { id: true },
  })
  if (!category) throw new Error('Категорія не знайдена')

  const count = await prisma.product.count({
    where: { categoryId: data.categoryId, companyId },
  })
  if (count > 0) {
    throw new Error(`Неможливо видалити: ${count} товарів належать цій категорії`)
  }

  await prisma.category.delete({ where: { id: data.categoryId } })
  revalidatePath('/products')
}

// ─── Subcategory ─────────────────────────────────────────────────────────────

const CreateSubcategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
})

export const createSubcategory = async (input: unknown): Promise<{ id: string }> => {
  const { companyId } = await getAdminSession()
  const data = CreateSubcategorySchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, companyId },
    select: { id: true },
  })
  if (!category) throw new Error('Категорія не знайдена')

  const subcategory = await prisma.subcategory.create({
    data: { categoryId: data.categoryId, name: data.name, sortOrder: data.sortOrder },
    select: { id: true },
  })

  revalidatePath('/products')
  return { id: subcategory.id }
}

const UpdateSubcategorySchema = z.object({
  subcategoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
})

export const updateSubcategory = async (input: unknown): Promise<void> => {
  const { companyId } = await getAdminSession()
  const data = UpdateSubcategorySchema.parse(input)

  const subcategory = await prisma.subcategory.findFirst({
    where: { id: data.subcategoryId },
    include: { category: { select: { companyId: true } } },
  })
  if (!subcategory || subcategory.category.companyId !== companyId) {
    throw new Error('Підкатегорія не знайдена')
  }

  await prisma.subcategory.update({
    where: { id: data.subcategoryId },
    data: { name: data.name, sortOrder: data.sortOrder },
  })

  revalidatePath('/products')
}

const DeleteSubcategorySchema = z.object({
  subcategoryId: z.string().min(1),
})

export const deleteSubcategory = async (input: unknown): Promise<void> => {
  const { companyId } = await getAdminSession()
  const data = DeleteSubcategorySchema.parse(input)

  const subcategory = await prisma.subcategory.findFirst({
    where: { id: data.subcategoryId },
    include: { category: { select: { companyId: true } } },
  })
  if (!subcategory || subcategory.category.companyId !== companyId) {
    throw new Error('Підкатегорія не знайдена')
  }

  const count = await prisma.product.count({
    where: { subcategoryId: data.subcategoryId },
  })
  if (count > 0) {
    throw new Error(`Неможливо видалити: ${count} товарів належать цій підкатегорії`)
  }

  await prisma.subcategory.delete({ where: { id: data.subcategoryId } })
  revalidatePath('/products')
}
