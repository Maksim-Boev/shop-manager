import type { IScheduledShiftRow, IStoreUserOption } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface IScheduleGridProps {
  shopId: string
  shifts: IScheduledShiftRow[]
  storeUsers: IStoreUserOption[]
  weekStartIso: string
  canManage: boolean
  userRole: UserRole
}

export interface IDayBucket {
  iso: string
  date: Date
  shifts: IScheduledShiftRow[]
}
