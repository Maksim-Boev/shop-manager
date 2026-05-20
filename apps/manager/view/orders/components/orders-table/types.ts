import type { IOrderRow } from '@pkg/db'

export interface IOrdersTableProps {
  orders: IOrderRow[]
  totalRevenue: number
  totalItems: number
  totalCount: number
  sortBy: string
  onSortBy: (v: string) => void
}
