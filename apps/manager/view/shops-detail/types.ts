import type {
  IShopOverview, IStoreProductRow, IShopStaffMember, IAvailableUser, IShopFinance,
  IShopMarginData,
  IScheduledShiftRow, IStoreUserOption, IStoreScheduleException, IStoreHoursConfig,
  TWeeklySchedule,
} from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export type TTabKey = 'overview' | 'stock' | 'staff' | 'schedule' | 'finance'
export type TRange = 'week' | 'month'

export interface IShopBasic {
  id: string
  name: string
  address: string | null
  region: string | null
  weeklySchedule: TWeeklySchedule | null
  scheduleExceptions: IStoreScheduleException[]
  phone: string | null
  status: 'ACTIVE' | 'ARCHIVED'
}

export type TTabData =
  | { tab: 'overview'; data: IShopOverview }
  | { tab: 'stock'; data: IStoreProductRow[] }
  | {
      tab: 'staff'
      data: IShopStaffMember[]
      availableUsers: IAvailableUser[]
      scheduledShifts: IScheduledShiftRow[]
      storeUsers: IStoreUserOption[]
      weekStartIso: string
    }
  | { tab: 'schedule'; data: IStoreHoursConfig }
  | { tab: 'finance'; data: IShopFinance; margin: IShopMarginData; range: TRange }

export interface IShopDetailViewProps {
  shop: IShopBasic
  activeTab: TTabKey
  tabData: TTabData
  userRole: UserRole
}
