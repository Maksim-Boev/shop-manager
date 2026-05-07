import { prisma } from '../prisma'
import type { AuthUser } from '../auth'
import type { UserStatus } from '@/generated/prisma/enums'

export interface ISetUserStatusInput {
  userId: string
  status: UserStatus
}

export const setUserStatusImpl = async (
  actor: AuthUser,
  input: ISetUserStatusInput,
): Promise<void> => {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Недостатньо прав')
  }

  const { userId, status } = input

  if (userId === actor.id) {
    throw new Error('Не можна змінити власний статус')
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId: actor.companyId ?? '' },
    select: { id: true, role: true, status: true },
  })
  if (!target) throw new Error('Користувача не знайдено')

  if (target.role === 'SUPER_ADMIN') {
    throw new Error('Не можна змінити статус Супер-адміна')
  }
  if (target.role === 'ADMIN' && actor.role === 'ADMIN') {
    throw new Error('Адмін не може змінити статус іншого адміна')
  }

  if (target.status === status) return

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  })
}
