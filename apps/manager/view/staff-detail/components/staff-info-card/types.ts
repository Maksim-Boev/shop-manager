import type { IStaffMemberDetail } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffInfoCardProps {
  member: IStaffMemberDetail
  stores: { id: string; name: string }[]
  actorRole: UserRole
  actorId: string
}
