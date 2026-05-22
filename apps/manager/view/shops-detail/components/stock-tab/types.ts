import type { IStoreProductRow, IProductRow } from '@pkg/db'

export interface IStockTabProps {
  storeId: string
  items: IStoreProductRow[]
  allProducts: IProductRow[]
}

export interface IStockFilterProps {
  search: string
  category: string
  onlyLow: boolean
  categories: string[]
  onSearch: (v: string) => void
  onCategory: (v: string) => void
  onOnlyLow: (v: boolean) => void
  actions?: React.ReactNode
}
