import type { TRoleFilter, TStatusFilter, IStoreOption } from '../../types'

export type { TRoleFilter, TStatusFilter, IStoreOption }

export interface IStaffFilterProps {
  search: string
  onSearch: (v: string) => void
  role: TRoleFilter
  onRole: (v: TRoleFilter) => void
  status: TStatusFilter
  onStatus: (v: TStatusFilter) => void
  storeId: string
  onStore: (v: string) => void
  stores: IStoreOption[]
}
