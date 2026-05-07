import type { IStaffMember } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffRowProps {
  member: IStaffMember
  actorRole: UserRole
  actorId: string
}
