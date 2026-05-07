export interface IStockFilterProps {
  search: string
  onSearch: (v: string) => void
  category: string
  onCategory: (v: string) => void
  categories: string[]
}
