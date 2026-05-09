import type { IProductDetail, ICategoryWithSubs, ITaxRate } from '@pkg/db'

export interface IProductDetailViewProps {
  product: IProductDetail
  categories: ICategoryWithSubs[]
  taxRates: ITaxRate[]
  canEdit: boolean
}
