import type { IProductRow, ICategoryWithSubs, ITaxRate } from '@pkg/db'

export interface IProductsViewProps {
  products: IProductRow[]
  categories: ICategoryWithSubs[]
  taxRates: ITaxRate[]
}
