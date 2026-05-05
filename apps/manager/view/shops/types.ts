import type { IShopWithStats } from '@pkg/db'
import type { StoreStatus, UserRole } from '@pkg/db/browser'

export type TViewMode = 'grid' | 'table'
export type TStatusFilter = 'ALL' | StoreStatus

export interface IShopsFilterProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: TStatusFilter
  onStatusFilter: (v: TStatusFilter) => void
  viewMode: TViewMode
  onViewMode: (v: TViewMode) => void
}

export interface IShopCardProps {
  shop: IShopWithStats
}

export interface IShopsGridProps {
  shops: IShopWithStats[]
}

export interface IShopsTableProps {
  shops: IShopWithStats[]
}

export interface IAddShopModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export interface IShopsViewProps {
  shops: IShopWithStats[]
  userRole: UserRole
}
