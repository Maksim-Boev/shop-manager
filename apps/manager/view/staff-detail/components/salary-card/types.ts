import type { ICurrentSalaryRate } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface ISalaryCardProps {
  userId: string
  currentRate: ICurrentSalaryRate | null
  actorRole: UserRole
}
