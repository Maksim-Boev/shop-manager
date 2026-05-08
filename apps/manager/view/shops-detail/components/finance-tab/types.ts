import type { IShopFinance, IShopMarginData } from '@pkg/db'
import type { TRange } from '../../types'

export interface IFinanceTabProps {
  data: IShopFinance
  margin: IShopMarginData
  shopId: string
  range: TRange
}
