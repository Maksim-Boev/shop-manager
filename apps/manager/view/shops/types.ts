import type { IShopWithStats } from '@pkg/db'
import type { StoreStatus, UserRole } from '@pkg/db/browser'

export type TViewMode = 'grid' | 'table'
export type TStatusFilter = 'ALL' | StoreStatus | 'OPEN_NOW'

export interface IShopsViewProps {
  shops: IShopWithStats[]
  userRole: UserRole
}
