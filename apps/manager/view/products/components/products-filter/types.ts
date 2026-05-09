import type { ICategoryWithSubs } from '@pkg/db'

export interface IProductsFilterProps {
  categories: ICategoryWithSubs[]
  search: string
  categoryId: string
  status: string
  onSearch: (v: string) => void
  onCategory: (v: string) => void
  onStatus: (v: string) => void
}
