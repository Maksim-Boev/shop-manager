'use server'
import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import { prisma, hashPassword } from '@pkg/db'
import { z } from 'zod'

export const loginAction = async (
  _: string | null,
  formData: FormData,
): Promise<string | null> => {
  const email = formData.get('email')
  const password = formData.get('password')
  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'Невірний email або пароль'
  }
  try {
    await signIn('credentials', { email, password, redirectTo: '/' })
    return null
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      return 'Невірний email або пароль'
    }
    throw error
  }
}

const TRegisterSchema = z.object({
  name: z.string().min(2, "Ім'я занадто коротке"),
  company: z.string().min(1, 'Введіть назву компанії'),
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
})

export const registerAction = async (
  _: string | null,
  formData: FormData,
): Promise<string | null> => {
  const parse = TRegisterSchema.safeParse({
    name: formData.get('name'),
    company: formData.get('company'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parse.success) return parse.error.errors[0].message

  const { name, company, email, password } = parse.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return 'Цей email вже використовується'

  const parts = name.trim().split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '-'

  await prisma.$transaction(async (tx) => {
    const newCompany = await tx.company.create({
      data: {
        name: company,
        tierAssignmentMode: 'CUMULATIVE_LIFETIME',
        pointsEarnPercent: 0,
        pointsRedemptionRate: 1,
        pointsExpiryMode: 'NEVER',
        maxPromotionPercent: 50,
        maxTierPercent: 30,
        maxCustomerRulePercent: 30,
        maxTotalDiscountPercent: 70,
      },
    })
    await tx.user.create({
      data: {
        companyId: newCompany.id,
        email,
        passwordHash: await hashPassword(password),
        firstName,
        lastName,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    })
  })

  try {
    await signIn('credentials', { email, password, redirectTo: '/' })
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      return 'Реєстрацію завершено — увійдіть з новими даними'
    }
    throw error
  }
  return null
}

export const forgotPasswordAction = async (
  _: boolean,
  formData: FormData,
): Promise<boolean> => {
  const email = formData.get('email')
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return false
  // TODO: відправити реальний лист для скидання пароля
  return true
}
