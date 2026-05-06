import type { TViewMode, TStatusFilter } from '../../types'

export type { TViewMode, TStatusFilter }

export interface IShopsFilterProps {
  search: string
  onSearch: (v: string) => void
  statusFilter: TStatusFilter
  onStatusFilter: (v: TStatusFilter) => void
  viewMode: TViewMode
  onViewMode: (v: TViewMode) => void
}
