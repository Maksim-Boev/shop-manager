import type { IStoreProductRow } from '@pkg/db'

export interface IStockTabProps {
  items: IStoreProductRow[]
}

export interface IStockFilterProps {
  search: string
  category: string
  onlyLow: boolean
  categories: string[]
  onSearch: (v: string) => void
  onCategory: (v: string) => void
  onOnlyLow: (v: boolean) => void
}
