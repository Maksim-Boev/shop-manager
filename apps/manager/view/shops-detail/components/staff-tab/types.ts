import type {
  IShopStaffMember, IAvailableUser, IScheduledShiftRow, IStoreUserOption,
} from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IStaffTabProps {
  members: IShopStaffMember[]
  availableUsers: IAvailableUser[]
  scheduledShifts: IScheduledShiftRow[]
  storeUsers: IStoreUserOption[]
  weekStartIso: string
  shopId: string
  userRole: UserRole
}

export interface IAssignManagerDialogProps {
  shopId: string
  availableUsers: IAvailableUser[]
  open: boolean
  onOpenChange: (v: boolean) => void
}
