import type {
  IShopOverview, IStoreProductRow, IShopStaffMember, IAvailableUser, IShopFinance,
} from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export type TTabKey = 'overview' | 'stock' | 'staff' | 'finance'
export type TRange = 'week' | 'month'

export interface IShopBasic {
  id: string
  name: string
  address: string | null
  region: string | null
  openingHours: string | null
  phone: string | null
  status: 'ACTIVE' | 'ARCHIVED'
}

export type TTabData =
  | { tab: 'overview'; data: IShopOverview }
  | { tab: 'stock'; data: IStoreProductRow[] }
  | { tab: 'staff'; data: IShopStaffMember[]; availableUsers: IAvailableUser[] }
  | { tab: 'finance'; data: IShopFinance; range: TRange }

export interface IShopDetailViewProps {
  shop: IShopBasic
  activeTab: TTabKey
  tabData: TTabData
  userRole: UserRole
}
