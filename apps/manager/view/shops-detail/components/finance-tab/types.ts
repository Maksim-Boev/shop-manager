import type { IShopFinance } from '@pkg/db'
import type { TRange } from '../../types'

export interface IFinanceTabProps {
  data: IShopFinance
  shopId: string
  range: TRange
}
