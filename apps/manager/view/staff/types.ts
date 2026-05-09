import type { IStaffMember } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export type TRoleFilter = 'ALL' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SALESPERSON'
export type TStatusFilter = 'ALL' | 'ACTIVE' | 'BLOCKED'

export interface IStoreOption {
  id: string
  name: string
}

export interface IStaffViewProps {
  staff: IStaffMember[]
  actorRole: UserRole
  actorId: string
  stores: IStoreOption[]
}
