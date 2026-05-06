import type { IShopStaffMember, IAvailableUser } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffTabProps {
  members: IShopStaffMember[]
  availableUsers: IAvailableUser[]
  shopId: string
  userRole: UserRole
}

export interface IAssignManagerDialogProps {
  shopId: string
  availableUsers: IAvailableUser[]
  open: boolean
  onOpenChange: (v: boolean) => void
}
