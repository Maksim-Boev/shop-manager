import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { UserRole } from '@/generated/prisma/enums'

export type { UserRole }

export type AuthUser = {
  id: string
  companyId: string | null
  role: UserRole
  firstName: string
  lastName: string
}

export type JwtClaims = AuthUser & {
  checkedAt?: number
}

export const verifyCredentials = async (
  email: string,
  password: string,
): Promise<AuthUser | null> => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  if (user.status === 'BLOCKED') return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return {
    id: user.id,
    companyId: user.companyId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}
