import type { IStaffMemberDetail } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffDetailViewProps {
  member: IStaffMemberDetail
  stores: { id: string; name: string }[]
  actorRole: UserRole
  actorId: string
}
