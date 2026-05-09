import type {
  IShopStaffMember, IAvailableUser, IScheduledShiftRow, IStoreUserOption,
} from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export type TAssignableRole = 'MANAGER' | 'CASHIER' | 'SALESPERSON'

export interface IStaffTabProps {
  members: IShopStaffMember[]
  availableUsers: IAvailableUser[]
  scheduledShifts: IScheduledShiftRow[]
  storeUsers: IStoreUserOption[]
  weekStartIso: string
  shopId: string
  userRole: UserRole
}

export interface IAssignStaffDialogProps {
  shopId: string
  availableUsers: IAvailableUser[]
  open: boolean
  onOpenChange: (v: boolean) => void
  targetRole: TAssignableRole
}
