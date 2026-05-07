import type { IStaffMember } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffTableProps {
  staff: IStaffMember[]
  actorRole: UserRole
  actorId: string
}
