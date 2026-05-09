import type { IProductDetail, ICategoryWithSubs, ITaxRate } from '@pkg/db'

export interface IProductInfoCardProps {
  product: IProductDetail
  categories: ICategoryWithSubs[]
  taxRates: ITaxRate[]
  canEdit: boolean
}
