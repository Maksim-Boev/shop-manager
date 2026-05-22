import type { IProductRow, ICategoryWithSubs, ITaxRate } from '@pkg/db'

export type TProductTab = 'products' | 'categories'

export interface IProductsViewProps {
  defaultTab: TProductTab
  categories: ICategoryWithSubs[]
  products?: IProductRow[]
  taxRates?: ITaxRate[]
}
